from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.models.box_position import BoxPosition
from app.models.project import Project
from app.models.project_primer import ProjectPrimer
from app.schemas.primer import PrimerCreate, PrimerUpdate
from app.services.primer_metrics import calculate_gc_percent, count_bases
from app.services import sort_ordering


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
        query.order_by(Primer.sort_order.asc(), Primer.id.asc())
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
    payload = _build_create_payload(data)
    await _ensure_unique_identity(session, name=payload["name"], mw=payload["mw"])
    payload["sort_order"] = await sort_ordering.next_sort_order(session, Primer)
    primer = Primer(**payload)
    session.add(primer)
    await _commit_primer(session)
    loaded_primer = await get_primer(session, primer.id)
    if loaded_primer is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Primer created but could not be reloaded",
        )
    return loaded_primer


async def update_primer(
    session: AsyncSession, primer: Primer, data: PrimerUpdate,
) -> Primer:
    updates = _prepare_updates(primer, data)
    await _ensure_unique_identity(
        session,
        name=updates.get("name", primer.name),
        mw=updates.get("mw", primer.mw),
        exclude_id=primer.id,
    )
    for key, value in updates.items():
        setattr(primer, key, value)
    await _commit_primer(session)
    loaded_primer = await get_primer(session, primer.id)
    if loaded_primer is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Primer updated but could not be reloaded",
        )
    return loaded_primer


async def reorder_primers(
    session: AsyncSession, primer_ids: list[int],
) -> None:
    await sort_ordering.reorder_subset(
        session, Primer, primer_ids, entity_label="引探",
    )
    await session.commit()


async def move_primer(
    session: AsyncSession, primer_id: int, target_sort_order: int,
) -> None:
    await sort_ordering.move_item(
        session, Primer, primer_id, target_sort_order, entity_label="引探",
    )
    await session.commit()


async def delete_primer(session: AsyncSession, primer: Primer) -> None:
    old_order = primer.sort_order
    await session.delete(primer)
    await session.flush()
    await sort_ordering.compact_after_delete(session, Primer, old_order)
    await session.commit()


def _build_create_payload(data: PrimerCreate) -> dict:
    payload = data.model_dump()
    payload["name"] = payload["name"].strip()
    payload["sequence"] = payload["sequence"].strip()
    payload["base_count"] = count_bases(payload["sequence"])
    payload["gc_percent"] = calculate_gc_percent(payload["sequence"])
    return payload


def _prepare_updates(primer: Primer, data: PrimerUpdate) -> dict:
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates:
        updates["name"] = updates["name"].strip()
    next_sequence = primer.sequence
    if "sequence" in updates:
        next_sequence = updates["sequence"].strip()
        updates["sequence"] = next_sequence
    updates["base_count"] = count_bases(next_sequence)
    updates["gc_percent"] = calculate_gc_percent(next_sequence)
    return updates


async def _ensure_unique_identity(
    session: AsyncSession,
    *,
    name: str,
    mw: float | None,
    exclude_id: int | None = None,
) -> None:
    query = select(Primer.id).where(Primer.name == name, _mw_equals(mw))
    if exclude_id is not None:
        query = query.where(Primer.id != exclude_id)
    existing_id = (await session.execute(query)).scalar_one_or_none()
    if existing_id is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="同名且 MW 相同的引探已存在",
        )


def _mw_equals(mw: float | None):
    if mw is None:
        return Primer.mw.is_(None)
    return Primer.mw == mw


async def _commit_primer(session: AsyncSession) -> None:
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if _is_identity_conflict(exc):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail="同名且 MW 相同的引探已存在",
            ) from exc
        raise


def _is_identity_conflict(error: IntegrityError) -> bool:
    message = str(error.orig)
    return "UNIQUE constraint failed: primers.name" in message
