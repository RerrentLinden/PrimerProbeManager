from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.primer import Primer
from app.models.primer_tube import PrimerTube

PrimerIdentity = tuple[str, float | None]


async def load_primers_by_identities(
    session: AsyncSession, identities: Iterable[PrimerIdentity]
) -> dict[PrimerIdentity, Primer]:
    identity_list = list(dict.fromkeys(identities))
    if not identity_list:
        return {}
    clauses = [and_(Primer.name == name, _mw_filter(mw)) for name, mw in identity_list]
    query = select(Primer).where(or_(*clauses))
    primers = (await session.execute(query)).scalars().all()
    return {(primer.name, primer.mw): primer for primer in primers}


async def find_tube(
    session: AsyncSession,
    *,
    primer_id: int,
    batch_number: str,
    tube_number: str | None,
) -> PrimerTube | None:
    query = select(PrimerTube).where(
        PrimerTube.primer_id == primer_id,
        PrimerTube.batch_number == batch_number,
    )
    if tube_number is None:
        query = query.where(PrimerTube.tube_number.is_(None))
    else:
        query = query.where(PrimerTube.tube_number == tube_number)
    matches = list((await session.execute(query)).scalars().all())
    if len(matches) > 1:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="存在多条相同引探/批号/分管编号的分管记录，无法唯一定位",
        )
    return matches[0] if matches else None


async def suggest_renamed_primer_name(
    session: AsyncSession,
    *,
    original_name: str,
    mw: float | None,
) -> str:
    suffix = "导入"
    index = 1
    while True:
        candidate = f"{original_name}_{suffix}{index}"
        exists = await _primer_identity_exists(session, candidate, mw)
        if not exists:
            return candidate
        index += 1


async def ensure_primer_identity_available(
    session: AsyncSession,
    *,
    name: str,
    mw: float | None,
) -> None:
    if await _primer_identity_exists(session, name, mw):
        raise ValueError(f"同名且 MW 相同的引探已存在: {name} / {mw}")


async def _primer_identity_exists(
    session: AsyncSession, name: str, mw: float | None
) -> bool:
    query = select(Primer.id).where(Primer.name == name, _mw_filter(mw))
    existing_id = (await session.execute(query)).scalar_one_or_none()
    return existing_id is not None


def _mw_filter(mw: float | None):
    if mw is None:
        return Primer.mw.is_(None)
    return Primer.mw == mw
