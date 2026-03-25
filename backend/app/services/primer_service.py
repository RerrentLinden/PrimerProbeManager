from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.models.box_position import BoxPosition
from app.models.project import Project
from app.models.project_primer import ProjectPrimer
from app.schemas.primer import PrimerCreate, PrimerUpdate

SEQUENCE_CHARS = frozenset("ATCGatcg")


def _count_bases(sequence: str) -> int:
    return sum(1 for c in sequence if c.upper() in SEQUENCE_CHARS)


async def list_primers(
    session: AsyncSession,
    *,
    search: str | None = None,
    search_field: str | None = None,
    primer_type: str | None = None,
    mod_5: str | None = None,
    mod_3: str | None = None,
    project_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Primer], int]:
    query = select(Primer)
    count_query = select(func.count(Primer.id))

    if search:
        pattern = f"%{search}%"
        flt = _build_search_filter(pattern, search_field)
        query = query.where(flt)
        count_query = count_query.where(flt)

    if primer_type in ("primer", "probe"):
        query, count_query = _filter_by_type(query, count_query, primer_type)

    if mod_5 is not None:
        flt = _mod_filter(Primer.modification_5prime, mod_5)
        query = query.where(flt)
        count_query = count_query.where(flt)

    if mod_3 is not None:
        flt = _mod_filter(Primer.modification_3prime, mod_3)
        query = query.where(flt)
        count_query = count_query.where(flt)

    if project_id:
        proj_flt = Primer.id.in_(
            select(ProjectPrimer.primer_id).where(
                ProjectPrimer.project_id == project_id
            )
        )
        query = query.where(proj_flt)
        count_query = count_query.where(proj_flt)

    total = (await session.execute(count_query)).scalar_one()
    query = (
        query.order_by(Primer.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(selectinload(Primer.tubes))
    )
    result = (await session.execute(query)).scalars().all()
    return list(result), total


def _mod_filter(column, value: str):
    """'__none__' = no modification, otherwise ilike match."""
    if value == "__none__":
        return column.is_(None)
    return column.ilike(f"%{value}%")


def _build_search_filter(pattern: str, field: str | None):
    if field == "name":
        return Primer.name.ilike(pattern)
    if field == "sequence":
        return Primer.sequence.ilike(pattern)
    if field == "modification":
        return or_(
            Primer.modification_5prime.ilike(pattern),
            Primer.modification_3prime.ilike(pattern),
        )
    return or_(
        Primer.name.ilike(pattern),
        Primer.sequence.ilike(pattern),
        Primer.modification_5prime.ilike(pattern),
        Primer.modification_3prime.ilike(pattern),
        Primer.id.in_(
            select(ProjectPrimer.primer_id)
            .join(Project)
            .where(Project.name.ilike(pattern))
        ),
    )


def _filter_by_type(query, count_query, primer_type: str):
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
        .options(
            selectinload(Primer.tubes)
            .selectinload(PrimerTube.position)
            .selectinload(BoxPosition.box),
        )
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
