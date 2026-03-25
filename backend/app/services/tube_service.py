from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer_tube import PrimerTube
from app.models.usage_log import UsageLog
from app.models.box_position import BoxPosition
from app.schemas.tube import TubeCreate, TubeUpdate, TubeMove
from app.schemas.usage_log import UsageLogCreate


async def list_tubes(
    session: AsyncSession,
    primer_id: int,
    *,
    tube_status: str | None = None,
) -> list[PrimerTube]:
    query = (
        select(PrimerTube)
        .where(PrimerTube.primer_id == primer_id)
        .options(selectinload(PrimerTube.position))
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
            selectinload(PrimerTube.position),
            selectinload(PrimerTube.primer),
        )
    )
    return (await session.execute(query)).scalar_one_or_none()


async def create_tube(
    session: AsyncSession, primer_id: int, data: TubeCreate,
) -> PrimerTube:
    tube = PrimerTube(
        primer_id=primer_id,
        batch_number=data.batch_number,
        dissolution_date=data.dissolution_date,
        initial_volume_ul=data.initial_volume_ul,
        remaining_volume_ul=data.initial_volume_ul,
        project=data.project,
    )
    session.add(tube)
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


async def archive_tube(session: AsyncSession, tube: PrimerTube) -> PrimerTube:
    tube.status = "archived"
    if tube.position:
        await session.delete(tube.position)
    await session.commit()
    await session.refresh(tube, ["position"])
    return tube


async def move_tube(
    session: AsyncSession, tube: PrimerTube, data: TubeMove,
) -> PrimerTube:
    _check_active(tube)
    await _check_target_empty(session, data.box_id, data.row, data.col)

    if tube.position:
        await session.delete(tube.position)
        await session.flush()

    new_pos = BoxPosition(
        box_id=data.box_id, row=data.row, col=data.col, tube_id=tube.id,
    )
    session.add(new_pos)
    await session.commit()
    await session.refresh(tube, ["position"])
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
