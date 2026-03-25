from fastapi import APIRouter, Depends
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.schemas.auth import StatsResponse, AlertTubeResponse

router = APIRouter(
    prefix="/api", tags=["stats"], dependencies=[Depends(verify_token)],
)

LOW_VOLUME_THRESHOLD = 0.05


@router.get("/stats", response_model=StatsResponse)
async def get_stats(session: AsyncSession = Depends(get_session)):
    total = (await session.execute(
        select(func.count(Primer.id))
    )).scalar_one()

    probe_count = (await session.execute(
        select(func.count(Primer.id)).where(
            or_(
                Primer.modification_5prime.isnot(None),
                Primer.modification_3prime.isnot(None),
            )
        )
    )).scalar_one()

    active_tubes = (await session.execute(
        select(func.count(PrimerTube.id))
        .where(PrimerTube.status == "active")
    )).scalar_one()

    low_vol = await _low_volume_count(session)

    return StatsResponse(
        primer_count=total - probe_count,
        probe_count=probe_count,
        active_tube_count=active_tubes,
        low_volume_count=low_vol,
    )


@router.get("/alerts/low-volume", response_model=list[AlertTubeResponse])
async def low_volume_alerts(session: AsyncSession = Depends(get_session)):
    query = (
        select(PrimerTube, Primer.name)
        .join(PrimerTube.primer)
        .where(
            PrimerTube.status == "active",
            PrimerTube.remaining_volume_ul
            < PrimerTube.initial_volume_ul * LOW_VOLUME_THRESHOLD,
        )
    )
    rows = (await session.execute(query)).all()
    return [
        AlertTubeResponse(
            tube_id=tube.id,
            primer_name=name,
            batch_number=tube.batch_number,
            remaining_volume_ul=tube.remaining_volume_ul,
            initial_volume_ul=tube.initial_volume_ul,
        )
        for tube, name in rows
    ]


async def _low_volume_count(session: AsyncSession) -> int:
    return (await session.execute(
        select(func.count(PrimerTube.id)).where(
            PrimerTube.status == "active",
            PrimerTube.remaining_volume_ul
            < PrimerTube.initial_volume_ul * LOW_VOLUME_THRESHOLD,
        )
    )).scalar_one()


