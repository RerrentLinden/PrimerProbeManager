from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.schemas.primer import PrimerCreate, PrimerUpdate

SEQUENCE_CHARS = frozenset("ATCGatcg")


def _count_bases(sequence: str) -> int:
    return sum(1 for c in sequence if c.upper() in SEQUENCE_CHARS)


async def list_primers(
    session: AsyncSession,
    *,
    search: str | None = None,
    primer_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Primer], int]:
    query = select(Primer)
    count_query = select(func.count(Primer.id))

    if search:
        pattern = f"%{search}%"
        flt = or_(Primer.name.ilike(pattern), Primer.sequence.ilike(pattern))
        query = query.where(flt)
        count_query = count_query.where(flt)

    if primer_type in ("primer", "probe"):
        query, count_query = _filter_by_type(query, count_query, primer_type)

    total = (await session.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Primer.id.desc())
    query = query.options(selectinload(Primer.tubes))
    result = (await session.execute(query)).scalars().all()
    return list(result), total


def _filter_by_type(query, count_query, primer_type: str):
    """Filter primers by type: probe = has any modification."""
    has_mod = or_(
        Primer.modification_5prime.isnot(None),
        Primer.modification_3prime.isnot(None),
    )
    if primer_type == "probe":
        return query.where(has_mod), count_query.where(has_mod)
    return query.where(~has_mod), count_query.where(~has_mod)


async def get_primer(session: AsyncSession, primer_id: int) -> Primer | None:
    query = (
        select(Primer)
        .where(Primer.id == primer_id)
        .options(selectinload(Primer.tubes).selectinload(PrimerTube.position))
    )
    return (await session.execute(query)).scalar_one_or_none()


async def create_primer(session: AsyncSession, data: PrimerCreate) -> Primer:
    primer = Primer(
        **data.model_dump(),
        base_count=_count_bases(data.sequence),
    )
    session.add(primer)
    await session.commit()
    await session.refresh(primer)
    return primer


async def update_primer(
    session: AsyncSession, primer: Primer, data: PrimerUpdate,
) -> Primer:
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(primer, key, value)
    if "sequence" in updates:
        primer.base_count = _count_bases(updates["sequence"])
    await session.commit()
    await session.refresh(primer)
    return primer


async def delete_primer(session: AsyncSession, primer: Primer) -> None:
    await session.delete(primer)
    await session.commit()
