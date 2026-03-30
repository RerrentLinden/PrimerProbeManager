"""Shared sort-order helpers for Primer / FreezerBox / Project."""

from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def next_sort_order(
    session: AsyncSession,
    model,
    *,
    filters: Sequence = (),
) -> int:
    query = select(func.coalesce(func.max(model.sort_order), 0))
    for f in filters:
        query = query.where(f)
    return (await session.execute(query)).scalar_one() + 1


async def reorder_subset(
    session: AsyncSession,
    model,
    ordered_ids: list[int],
    *,
    filters: Sequence = (),
    entity_label: str = "Item",
) -> None:
    if not ordered_ids:
        return
    if len(set(ordered_ids)) != len(ordered_ids):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"{entity_label} ID 列表包含重复项",
        )
    items = await _load_items(session, model, filters=filters)
    by_id = {item.id: item for item in items}
    missing = [i for i in ordered_ids if i not in by_id]
    if missing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"{entity_label} 不存在: {missing}",
        )
    selected = [by_id[i] for i in ordered_ids]
    slots = sorted(item.sort_order for item in selected)
    for slot, item in zip(slots, selected):
        item.sort_order = slot
    await session.flush()


async def move_item(
    session: AsyncSession,
    model,
    item_id: int,
    target_sort_order: int,
    *,
    filters: Sequence = (),
    entity_label: str = "Item",
) -> None:
    items = await _load_items(session, model, filters=filters)
    by_id = {item.id: item for item in items}
    if item_id not in by_id:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"{entity_label} 不存在",
        )
    target = max(1, min(target_sort_order, len(items)))
    current_idx = next(i for i, it in enumerate(items) if it.id == item_id)
    target_idx = target - 1
    if current_idx == target_idx:
        return
    moved = items.pop(current_idx)
    items.insert(target_idx, moved)
    lo = min(current_idx, target_idx)
    hi = max(current_idx, target_idx)
    affected = items[lo : hi + 1]
    slots = sorted(it.sort_order for it in affected)
    for slot, it in zip(slots, affected):
        it.sort_order = slot
    await session.flush()


async def compact_after_delete(
    session: AsyncSession,
    model,
    deleted_sort_order: int,
    *,
    filters: Sequence = (),
) -> None:
    from sqlalchemy import update

    stmt = (
        update(model)
        .where(model.sort_order > deleted_sort_order)
        .values(sort_order=model.sort_order - 1)
    )
    for f in filters:
        stmt = stmt.where(f)
    await session.execute(stmt)


async def _load_items(session: AsyncSession, model, *, filters: Sequence) -> list:
    query = select(model).order_by(model.sort_order.asc(), model.id.asc())
    for f in filters:
        query = query.where(f)
    return list((await session.execute(query)).scalars().all())
