from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.project_primer import ProjectPrimer
from app.models.project_gene import ProjectGene
from app.models.primer_tube import PrimerTube
from app.models.box_position import BoxPosition
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectGeneCreate, ProjectGeneUpdate,
)


async def list_projects(
    session: AsyncSession, *, search: str | None = None,
) -> list[dict]:
    query = select(Project).order_by(Project.id.desc())
    if search:
        query = query.where(Project.name.ilike(f"%{search}%"))
    projects = (await session.execute(query)).scalars().all()
    result = []
    for p in projects:
        counts = await _get_counts(session, p.id)
        result.append({**_project_dict(p), **counts})
    return result


async def get_project(session: AsyncSession, project_id: int) -> dict | None:
    query = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.primer_links)
            .selectinload(ProjectPrimer.tube)
            .selectinload(PrimerTube.primer),
            selectinload(Project.primer_links)
            .selectinload(ProjectPrimer.tube)
            .selectinload(PrimerTube.position)
            .selectinload(BoxPosition.box),
            selectinload(Project.genes),
        )
    )
    project = (await session.execute(query)).scalar_one_or_none()
    if not project:
        return None
    tubes = [link.tube for link in project.primer_links if link.tube]
    genes = sorted(project.genes, key=lambda g: g.sort_order)
    counts = await _get_counts(session, project.id)
    return {
        **_project_dict(project),
        **counts,
        "tubes": tubes,
        "genes": genes,
    }


async def create_project(
    session: AsyncSession, data: ProjectCreate,
) -> Project:
    project = Project(**data.model_dump())
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def update_project(
    session: AsyncSession, project: Project, data: ProjectUpdate,
) -> Project:
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    await session.commit()
    await session.refresh(project)
    return project


async def delete_project(session: AsyncSession, project: Project) -> None:
    await session.delete(project)
    await session.commit()


async def add_tube_to_project(
    session: AsyncSession, project_id: int, tube_id: int,
) -> ProjectPrimer:
    link = ProjectPrimer(project_id=project_id, tube_id=tube_id)
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link


async def remove_tube_from_project(
    session: AsyncSession, project_id: int, tube_id: int,
) -> None:
    query = select(ProjectPrimer).where(
        ProjectPrimer.project_id == project_id,
        ProjectPrimer.tube_id == tube_id,
    )
    link = (await session.execute(query)).scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Link not found")
    await session.delete(link)
    await session.commit()


async def add_gene(
    session: AsyncSession, project_id: int, data: ProjectGeneCreate,
) -> ProjectGene:
    max_order = (
        await session.execute(
            select(func.coalesce(func.max(ProjectGene.sort_order), -1))
            .where(ProjectGene.project_id == project_id)
        )
    ).scalar_one()
    gene = ProjectGene(
        project_id=project_id,
        **data.model_dump(),
        sort_order=max_order + 1,
    )
    session.add(gene)
    await session.commit()
    await session.refresh(gene)
    return gene


async def update_gene(
    session: AsyncSession, gene: ProjectGene, data: ProjectGeneUpdate,
) -> ProjectGene:
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(gene, key, val)
    await session.commit()
    await session.refresh(gene)
    return gene


async def delete_gene(session: AsyncSession, gene: ProjectGene) -> None:
    await session.delete(gene)
    await session.commit()


async def reorder_genes(
    session: AsyncSession, project_id: int, gene_ids: list[int],
) -> list[ProjectGene]:
    query = select(ProjectGene).where(
        ProjectGene.project_id == project_id,
    )
    genes = {g.id: g for g in (await session.execute(query)).scalars().all()}
    for idx, gid in enumerate(gene_ids):
        if gid in genes:
            genes[gid].sort_order = idx
    await session.commit()
    return sorted(genes.values(), key=lambda g: g.sort_order)


async def get_gene(
    session: AsyncSession, gene_id: int,
) -> ProjectGene | None:
    return (
        await session.execute(
            select(ProjectGene).where(ProjectGene.id == gene_id)
        )
    ).scalar_one_or_none()


async def get_project_raw(
    session: AsyncSession, project_id: int,
) -> Project | None:
    return (
        await session.execute(
            select(Project).where(Project.id == project_id)
        )
    ).scalar_one_or_none()


async def list_genes(
    session: AsyncSession, project_id: int,
) -> list[ProjectGene]:
    query = (
        select(ProjectGene)
        .where(ProjectGene.project_id == project_id)
        .order_by(ProjectGene.sort_order)
    )
    return list((await session.execute(query)).scalars().all())


async def _get_counts(session: AsyncSession, project_id: int) -> dict:
    tube_count = (
        await session.execute(
            select(func.count(ProjectPrimer.id))
            .where(ProjectPrimer.project_id == project_id)
        )
    ).scalar_one()
    gene_count = (
        await session.execute(
            select(func.count(ProjectGene.id))
            .where(ProjectGene.project_id == project_id)
        )
    ).scalar_one()
    return {"tube_count": tube_count, "gene_count": gene_count}


def _project_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }
