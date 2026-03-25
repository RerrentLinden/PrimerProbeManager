from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer_tube import PrimerTube
from app.models.primer import Primer
from app.models.usage_log import UsageLog
from app.models.box_position import BoxPosition
from app.models.freezer_box import FreezerBox
from app.schemas.tube import TubeCreate, TubeUpdate, TubeMove
from app.schemas.usage_log import UsageLogCreate
from app.services import tube_lifecycle_log_service


async def list_tubes(
    session: AsyncSession,
    primer_id: int,
    *,
    tube_status: str | None = None,
) -> list[PrimerTube]:
    query = (
        select(PrimerTube)
        .where(PrimerTube.primer_id == primer_id)
        .options(
            selectinload(PrimerTube.position).selectinload(BoxPosition.box),
        )
        .order_by(PrimerTube.id.desc())
    )
    if tube_status:
        query = query.where(PrimerTube.status == tube_status)
    return list((await session.execute(query)).scalars().all())


async def get_tube(session: AsyncSession, tube_id: int) -> PrimerTube | None:
    query = (
        select(PrimerTube)
        .where(PrimerTube.id == tube_id)
        .options(
            selectinload(PrimerTube.position).selectinload(BoxPosition.box),
            selectinload(PrimerTube.primer),
        )
    )
    return (await session.execute(query)).scalar_one_or_none()


async def create_tube(
    session: AsyncSession, primer_id: int, data: TubeCreate,
) -> PrimerTube:
    primer = await _get_primer(session, primer_id)
    tube = PrimerTube(
        primer_id=primer_id,
        batch_number=data.batch_number,
        tube_number=data.tube_number,
        dissolution_date=data.dissolution_date,
        initial_volume_ul=data.initial_volume_ul,
        remaining_volume_ul=data.initial_volume_ul,
        project=data.project,
    )
    session.add(tube)
    await session.flush()
    tube_lifecycle_log_service.stage_created_log(
        session,
        tube=tube,
        primer_name=primer.name,
        primer_type=primer.type,
    )
    await session.commit()
    await session.refresh(tube, ["position"])
    return tube


async def update_tube(
    session: AsyncSession, tube: PrimerTube, data: TubeUpdate,
) -> PrimerTube:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tube, key, value)
    await session.commit()
    await session.refresh(tube, ["position"])
    return tube


async def archive_tube(
    session: AsyncSession, tube: PrimerTube, *, reason: str | None = None,
) -> PrimerTube:
    from_position = await tube_lifecycle_log_service.get_current_position_label(
        session, tube.id,
    )
    tube.status = "archived"
    tube.archive_reason = reason
    old_pos = (await session.execute(
        select(BoxPosition).where(BoxPosition.tube_id == tube.id)
    )).scalar_one_or_none()
    if old_pos:
        await session.delete(old_pos)
    tube_lifecycle_log_service.stage_archive_log(
        session,
        tube=tube,
        primer_name=tube.primer.name,
        primer_type=tube.primer.type,
        archive_reason=reason,
        from_position=from_position,
    )
    await session.commit()
    return tube


async def move_tube(
    session: AsyncSession, tube: PrimerTube, data: TubeMove,
) -> PrimerTube:
    _check_active(tube)
    await _check_target_empty(session, data.box_id, data.row, data.col)
    from_position = await tube_lifecycle_log_service.get_current_position_label(
        session, tube.id,
    )
    to_position = await tube_lifecycle_log_service.get_target_position_label(
        session, data.box_id, data.row, data.col,
    )

    old_pos = (await session.execute(
        select(BoxPosition).where(BoxPosition.tube_id == tube.id)
    )).scalar_one_or_none()
    if old_pos:
        await session.delete(old_pos)
        await session.flush()

    new_pos = BoxPosition(
        box_id=data.box_id, row=data.row, col=data.col, tube_id=tube.id,
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
    return tube


async def add_usage_log(
    session: AsyncSession, tube: PrimerTube, data: UsageLogCreate,
) -> UsageLog:
    _check_active(tube)
    if data.volume_used_ul > tube.remaining_volume_ul:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Requested {data.volume_used_ul} uL exceeds "
                f"remaining {tube.remaining_volume_ul} uL"
            ),
        )
    remaining = tube.remaining_volume_ul - data.volume_used_ul
    log = UsageLog(
        tube_id=tube.id,
        usage_date=data.usage_date or date.today(),
        volume_used_ul=data.volume_used_ul,
        purpose=data.purpose,
        project=data.project,
        remaining_after_ul=remaining,
    )
    tube.remaining_volume_ul = remaining
    session.add(log)
    tube_lifecycle_log_service.stage_usage_log(
        session,
        tube=tube,
        primer_name=tube.primer.name,
        primer_type=tube.primer.type,
        volume_used_ul=data.volume_used_ul,
        remaining_volume_ul=remaining,
        purpose=data.purpose,
        project_name=data.project,
    )
    await session.commit()
    await session.refresh(log)
    return log


async def list_usage_logs(
    session: AsyncSession, tube_id: int,
) -> list[UsageLog]:
    query = (
        select(UsageLog)
        .where(UsageLog.tube_id == tube_id)
        .order_by(UsageLog.id.desc())
    )
    return list((await session.execute(query)).scalars().all())


def _check_active(tube: PrimerTube) -> None:
    if tube.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tube is archived",
        )


async def _check_target_empty(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> None:
    existing = (
        await session.execute(
            select(BoxPosition).where(
                BoxPosition.box_id == box_id,
                BoxPosition.row == row,
                BoxPosition.col == col,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Position ({row}, {col}) is already occupied",
        )


async def _get_primer(session: AsyncSession, primer_id: int):
    result = await session.execute(select(Primer).where(Primer.id == primer_id))
    primer = result.scalar_one_or_none()
    if primer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    return primer
