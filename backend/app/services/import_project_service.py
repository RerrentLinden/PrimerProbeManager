from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_primer import ProjectPrimer


async def attach_projects_to_primer(
    session: AsyncSession,
    *,
    primer_id: int,
    project_names: tuple[str, ...],
) -> None:
    if not project_names:
        return
    projects = await _load_or_create_projects(session, project_names)
    project_ids = [project.id for project in projects]
    existing_ids = await _load_existing_link_ids(
        session,
        primer_id=primer_id,
        project_ids=project_ids,
    )
    for project in projects:
        if project.id in existing_ids:
            continue
        session.add(ProjectPrimer(project_id=project.id, primer_id=primer_id))
    await session.flush()


async def _load_or_create_projects(
    session: AsyncSession,
    project_names: tuple[str, ...],
) -> list[Project]:
    query = select(Project).where(Project.name.in_(project_names))
    existing = {
        project.name: project
        for project in (await session.execute(query)).scalars().all()
    }
    for name in project_names:
        if name in existing:
            continue
        project = Project(name=name)
        session.add(project)
        existing[name] = project
    await session.flush()
    return [existing[name] for name in project_names]


async def _load_existing_link_ids(
    session: AsyncSession,
    *,
    primer_id: int,
    project_ids: list[int],
) -> set[int]:
    query = select(ProjectPrimer.project_id).where(
        ProjectPrimer.primer_id == primer_id,
        ProjectPrimer.project_id.in_(project_ids),
    )
    return set((await session.execute(query)).scalars().all())
