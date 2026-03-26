from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.box_position import BoxPosition
from app.models.freezer_box import FreezerBox
from app.models.primer_tube import PrimerTube


async def validate_available_slot(
    session: AsyncSession,
    *,
    box_id: int,
    row: int,
    col: int,
) -> None:
    await _validate_box_range(session, box_id=box_id, row=row, col=col)
    existing = await get_position(session, box_id=box_id, row=row, col=col)
    if existing is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"冻存盒孔位 {_slot(row, col)} 已被占用",
        )


async def ensure_tube_unplaced(
    session: AsyncSession, *, tube_id: int,
) -> None:
    await ensure_tube_not_placed_elsewhere(session, tube_id=tube_id)


async def ensure_tube_not_placed_elsewhere(
    session: AsyncSession,
    *,
    tube_id: int,
    exclude_position_id: int | None = None,
) -> None:
    query = (
        select(
            BoxPosition.id,
            FreezerBox.name,
            BoxPosition.row,
            BoxPosition.col,
        )
        .join(FreezerBox, FreezerBox.id == BoxPosition.box_id)
        .where(BoxPosition.tube_id == tube_id)
    )
    existing = (await session.execute(query)).one_or_none()
    if existing is None:
        return
    if exclude_position_id is not None and existing.id == exclude_position_id:
        return
    raise HTTPException(
        status.HTTP_409_CONFLICT,
        detail=f"该分管已放置在 {existing.name} {_slot(existing.row, existing.col)}，请先移动或移除",
    )


async def get_position(
    session: AsyncSession,
    *,
    box_id: int,
    row: int,
    col: int,
) -> BoxPosition | None:
    query = select(BoxPosition).where(
        BoxPosition.box_id == box_id,
        BoxPosition.row == row,
        BoxPosition.col == col,
    )
    return (await session.execute(query)).scalar_one_or_none()


async def commit_position_change(session: AsyncSession) -> None:
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if _is_position_conflict(exc):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail="冻存盒孔位已占用，无法放入多管引探",
            ) from exc
        if _is_tube_conflict(exc):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail="该分管已经放置在其他孔位中，请先移动或移除",
            ) from exc
        raise


async def get_active_tube_with_primer(
    session: AsyncSession, *, tube_id: int
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
    if tube.status != "active":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Tube is archived",
        )
    return tube


async def _validate_box_range(
    session: AsyncSession,
    *,
    box_id: int,
    row: int,
    col: int,
) -> None:
    box = (
        await session.execute(
            select(FreezerBox).where(FreezerBox.id == box_id)
        )
    ).scalar_one_or_none()
    if box is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="冻存盒不存在")
    if row < 0 or row >= box.rows or col < 0 or col >= box.cols:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="孔位超出冻存盒范围",
        )


def _is_position_conflict(error: IntegrityError) -> bool:
    message = str(error.orig)
    return "box_positions.box_id, box_positions.row, box_positions.col" in message


def _is_tube_conflict(error: IntegrityError) -> bool:
    return "box_positions.tube_id" in str(error.orig)


def _slot(row: int, col: int) -> str:
    return f"{chr(ord('A') + row)}{col + 1}"
