from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.models.freezer_box import FreezerBox
from app.models.box_position import BoxPosition

MAX_SEARCH_RESULTS = 50


async def global_search(
    session: AsyncSession,
    q: str,
    *,
    search_type: str = "all",
) -> dict:
    pattern = f"%{q}%"
    primers: list = []
    tubes: list = []
    boxes: list = []

    if search_type in ("all", "primer"):
        primers = await _search_primers(session, pattern)

    if search_type in ("all", "tube"):
        tubes = await _search_tubes(session, pattern)

    if search_type in ("all", "box"):
        boxes = await _search_boxes(session, pattern)

    return {"primers": primers, "tubes": tubes, "boxes": boxes}


async def _search_primers(session: AsyncSession, pattern: str) -> list:
    query = (
        select(Primer)
        .where(or_(Primer.name.ilike(pattern), Primer.sequence.ilike(pattern)))
        .limit(MAX_SEARCH_RESULTS)
    )
    return list((await session.execute(query)).scalars().all())


async def _search_tubes(session: AsyncSession, pattern: str) -> list:
    query = (
        select(PrimerTube)
        .join(PrimerTube.primer)
        .where(
            or_(
                PrimerTube.batch_number.ilike(pattern),
                Primer.name.ilike(pattern),
                PrimerTube.project.ilike(pattern),
            )
        )
        .options(
            selectinload(PrimerTube.position).selectinload(BoxPosition.box),
            selectinload(PrimerTube.primer),
        )
        .limit(MAX_SEARCH_RESULTS)
    )
    return list((await session.execute(query)).scalars().all())


async def _search_boxes(session: AsyncSession, pattern: str) -> list:
    query = (
        select(FreezerBox)
        .where(
            or_(
                FreezerBox.name.ilike(pattern),
                FreezerBox.storage_location.ilike(pattern),
            )
        )
        .limit(MAX_SEARCH_RESULTS)
    )
    return list((await session.execute(query)).scalars().all())
