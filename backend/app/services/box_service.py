from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.freezer_box import FreezerBox
from app.models.box_position import BoxPosition
from app.models.primer_tube import PrimerTube
from app.models.primer import Primer
from app.schemas.box import (
    BoxCreate, BoxUpdate, SlotTubeInfo, GridSlot, BoxMoveRequest,
)
from app.services import tube_lifecycle_log_service


async def list_boxes(
    session: AsyncSession, *, search: str | None = None,
) -> list[dict]:
    query = select(FreezerBox).order_by(FreezerBox.id.desc())
    if search:
        query = query.where(FreezerBox.name.ilike(f"%{search}%"))
    boxes = (await session.execute(query)).scalars().all()
    result = []
    for box in boxes:
        count = await _occupied_count(session, box.id)
        result.append(_box_to_dict(box, count))
    return result


async def get_box(session: AsyncSession, box_id: int) -> FreezerBox | None:
    query = (
        select(FreezerBox)
        .where(FreezerBox.id == box_id)
        .options(
            selectinload(FreezerBox.positions)
            .selectinload(BoxPosition.tube)
            .selectinload(PrimerTube.primer)
        )
    )
    return (await session.execute(query)).scalar_one_or_none()


def build_grid(box: FreezerBox) -> list[list[GridSlot]]:
    grid: list[list[GridSlot]] = [
        [GridSlot(row=r, col=c) for c in range(box.cols)]
        for r in range(box.rows)
    ]
    for pos in box.positions:
        tube = pos.tube
        if tube and tube.primer:
            grid[pos.row][pos.col] = GridSlot(
                row=pos.row,
                col=pos.col,
                tube=SlotTubeInfo(
                    tube_id=tube.id,
                    primer_id=tube.primer.id,
                    primer_name=tube.primer.name,
                    primer_type=tube.primer.type,
                    batch_number=tube.batch_number,
                    tube_number=tube.tube_number,
                    remaining_volume_ul=tube.remaining_volume_ul,
                    initial_volume_ul=tube.initial_volume_ul,
                ),
            )
    return grid


async def create_box(session: AsyncSession, data: BoxCreate) -> FreezerBox:
    box = FreezerBox(**data.model_dump())
    session.add(box)
    await session.commit()
    await session.refresh(box)
    return box


async def update_box(
    session: AsyncSession, box: FreezerBox, data: BoxUpdate,
) -> FreezerBox:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(box, key, value)
    await session.commit()
    await session.refresh(box)
    return box


async def delete_box(session: AsyncSession, box: FreezerBox) -> None:
    await session.delete(box)
    await session.commit()


async def place_tube(
    session: AsyncSession,
    box_id: int,
    row: int,
    col: int,
    tube_id: int,
) -> BoxPosition:
    await _validate_position(session, box_id, row, col)
    await _check_target_free(session, box_id, row, col)
    tube = await _get_tube_with_primer(session, tube_id)
    to_position = await tube_lifecycle_log_service.get_target_position_label(
        session, box_id, row, col,
    )
    pos = BoxPosition(box_id=box_id, row=row, col=col, tube_id=tube_id)
    session.add(pos)
    tube_lifecycle_log_service.stage_position_log(
        session,
        tube=tube,
        primer_name=tube.primer.name,
        primer_type=tube.primer.type,
        from_position=None,
        to_position=to_position,
    )
    await session.commit()
    await session.refresh(pos)
    return pos


async def remove_from_position(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> None:
    pos = await _get_position(session, box_id, row, col)
    if not pos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position is empty",
        )
    await session.delete(pos)
    await session.commit()


async def move_within_box(
    session: AsyncSession, box_id: int, data: BoxMoveRequest,
) -> None:
    source = await _get_position(session, box_id, data.from_row, data.from_col)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source position is empty",
        )
    target_box = data.to_box_id or box_id
    await _validate_position(session, target_box, data.to_row, data.to_col)
    await _check_target_free(session, target_box, data.to_row, data.to_col)
    tube = await _get_tube_with_primer(session, source.tube_id)
    from_position = await tube_lifecycle_log_service.get_target_position_label(
        session, box_id, data.from_row, data.from_col,
    )
    to_position = await tube_lifecycle_log_service.get_target_position_label(
        session, target_box, data.to_row, data.to_col,
    )

    tube_id = source.tube_id
    await session.delete(source)
    await session.flush()

    new_pos = BoxPosition(
        box_id=target_box, row=data.to_row, col=data.to_col, tube_id=tube_id,
    )
    session.add(new_pos)
    tube_lifecycle_log_service.stage_position_log(
        session,
        tube=tube,
        primer_name=tube.primer.name,
        primer_type=tube.primer.type,
        from_position=from_position,
        to_position=to_position,
    )
    await session.commit()


async def _occupied_count(session: AsyncSession, box_id: int) -> int:
    result = await session.execute(
        select(func.count(BoxPosition.id)).where(BoxPosition.box_id == box_id)
    )
    return result.scalar_one()


async def _validate_position(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> None:
    box = (
        await session.execute(
            select(FreezerBox).where(FreezerBox.id == box_id)
        )
    ).scalar_one_or_none()
    if not box:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Box not found")
    if row < 0 or row >= box.rows or col < 0 or col >= box.cols:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Position out of range",
        )


async def _check_target_free(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> None:
    existing = await _get_position(session, box_id, row, col)
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Position ({row}, {col}) is occupied",
        )


async def _get_position(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> BoxPosition | None:
    return (
        await session.execute(
            select(BoxPosition).where(
                BoxPosition.box_id == box_id,
                BoxPosition.row == row,
                BoxPosition.col == col,
            )
        )
    ).scalar_one_or_none()


def _box_to_dict(box: FreezerBox, occupied: int) -> dict:
    return {
        "id": box.id,
        "name": box.name,
        "rows": box.rows,
        "cols": box.cols,
        "storage_location": box.storage_location,
        "storage_temperature": box.storage_temperature,
        "occupied_count": occupied,
        "created_at": box.created_at,
        "updated_at": box.updated_at,
    }


async def _get_tube_with_primer(
    session: AsyncSession, tube_id: int,
) -> PrimerTube:
    tube = (
        await session.execute(
            select(PrimerTube)
            .where(PrimerTube.id == tube_id)
            .options(selectinload(PrimerTube.primer))
        )
    ).scalar_one_or_none()
    if tube is None or tube.primer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    return tube
