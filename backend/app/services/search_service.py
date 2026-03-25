from sqlalchemy import String, cast, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.project_primer import ProjectPrimer
from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.models.freezer_box import FreezerBox
from app.models.box_position import BoxPosition

MAX_SEARCH_RESULTS = 50
PRIMER_TYPE_KEYWORDS = frozenset({"primer", "primers", "引物"})
PROBE_TYPE_KEYWORDS = frozenset({"probe", "probes", "探针"})


async def global_search(
    session: AsyncSession,
    q: str,
    *,
    search_type: str = "all",
) -> dict:
    query_text = q.strip()
    pattern = f"%{query_text}%"
    primers: list = []
    tubes: list = []
    boxes: list = []
    projects: list = []

    if search_type in ("all", "primer"):
        primers = await _search_primers(session, query_text, pattern)

    if search_type in ("all", "tube"):
        tubes = await _search_tubes(session, pattern)

    if search_type in ("all", "box"):
        boxes = await _search_boxes(session, pattern)

    if search_type in ("all", "project"):
        projects = await _search_projects(session, pattern)

    return {
        "primers": primers,
        "tubes": tubes,
        "boxes": boxes,
        "projects": projects,
    }


async def _search_primers(
    session: AsyncSession,
    query_text: str,
    pattern: str,
) -> list[dict]:
    filters = [
        Primer.name.ilike(pattern),
        Primer.sequence.ilike(pattern),
        Primer.modification_5prime.ilike(pattern),
        Primer.modification_3prime.ilike(pattern),
        cast(Primer.mw, String).ilike(pattern),
        Primer.id.in_(
            select(ProjectPrimer.primer_id)
            .join(Project)
            .where(Project.name.ilike(pattern))
        ),
    ]
    primer_type_filter = _primer_type_filter(query_text)
    if primer_type_filter is not None:
        filters.append(primer_type_filter)
    query = (
        select(Primer)
        .where(or_(*filters))
        .order_by(Primer.id.desc())
        .limit(MAX_SEARCH_RESULTS)
    )
    primers = list((await session.execute(query)).scalars().all())
    projects_by_primer = await _load_projects_by_primer_ids(
        session,
        [primer.id for primer in primers],
    )
    return [
        _primer_dict(primer, projects_by_primer.get(primer.id, []))
        for primer in primers
    ]


async def _search_tubes(session: AsyncSession, pattern: str) -> list[dict]:
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
        .order_by(PrimerTube.id.desc())
        .limit(MAX_SEARCH_RESULTS)
    )
    tubes = list((await session.execute(query)).scalars().all())
    return [_tube_dict(tube) for tube in tubes]


async def _search_boxes(session: AsyncSession, pattern: str) -> list[dict]:
    query = (
        select(FreezerBox)
        .where(
            or_(
                FreezerBox.name.ilike(pattern),
                FreezerBox.storage_location.ilike(pattern),
            )
        )
        .order_by(FreezerBox.id.desc())
        .limit(MAX_SEARCH_RESULTS)
    )
    boxes = list((await session.execute(query)).scalars().all())
    return [_box_dict(box) for box in boxes]


async def _search_projects(session: AsyncSession, pattern: str) -> list[dict]:
    query = (
        select(Project)
        .where(Project.name.ilike(pattern))
        .order_by(Project.id.desc())
        .limit(MAX_SEARCH_RESULTS)
    )
    projects = list((await session.execute(query)).scalars().all())
    return [_project_dict(project) for project in projects]


async def _load_projects_by_primer_ids(
    session: AsyncSession,
    primer_ids: list[int],
) -> dict[int, list[dict]]:
    if not primer_ids:
        return {}
    query = (
        select(ProjectPrimer.primer_id, Project.id, Project.name)
        .join(Project, Project.id == ProjectPrimer.project_id)
        .where(ProjectPrimer.primer_id.in_(primer_ids))
        .order_by(Project.id.desc())
    )
    rows = (await session.execute(query)).all()
    projects_by_primer: dict[int, list[dict]] = {primer_id: [] for primer_id in primer_ids}
    for primer_id, project_id, project_name in rows:
        projects_by_primer.setdefault(primer_id, []).append({
            "id": project_id,
            "name": project_name,
        })
    return projects_by_primer


def _primer_type_filter(query_text: str):
    normalized = query_text.strip().lower()
    has_modification = or_(
        Primer.modification_5prime.isnot(None),
        Primer.modification_3prime.isnot(None),
    )
    if normalized in PROBE_TYPE_KEYWORDS:
        return has_modification
    if normalized in PRIMER_TYPE_KEYWORDS:
        return ~has_modification
    return None


def _primer_dict(primer: Primer, projects: list[dict]) -> dict:
    return {
        "id": primer.id,
        "name": primer.name,
        "sequence": primer.sequence,
        "modification_5prime": primer.modification_5prime,
        "modification_3prime": primer.modification_3prime,
        "type": primer.type,
        "mw": primer.mw,
        "projects": projects,
    }


def _tube_dict(tube: PrimerTube) -> dict:
    return {
        "id": tube.id,
        "primer_id": tube.primer_id,
        "primer_name": tube.primer.name if tube.primer else "",
        "batch_number": tube.batch_number,
        "tube_number": tube.tube_number,
        "position": _position_dict(tube.position),
    }


def _position_dict(position: BoxPosition | None) -> dict | None:
    if position is None:
        return None
    box = position.box
    return {
        "box_id": position.box_id,
        "box_name": box.name if box else "",
        "storage_location": box.storage_location if box else None,
        "storage_temperature": box.storage_temperature if box else None,
        "row": position.row,
        "col": position.col,
    }


def _box_dict(box: FreezerBox) -> dict:
    return {
        "id": box.id,
        "name": box.name,
        "storage_location": box.storage_location,
    }


def _project_dict(project: Project) -> dict:
    return {
        "id": project.id,
        "name": project.name,
    }
