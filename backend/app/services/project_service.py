from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.project_primer import ProjectPrimer
from app.models.project_gene import ProjectGene
from app.models.primer import Primer
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectGeneCreate, ProjectGeneUpdate,
)
from app.services import sort_ordering


async def list_projects(
    session: AsyncSession, *, search: str | None = None,
) -> list[dict]:
    query = select(Project).order_by(Project.sort_order.asc(), Project.id.asc())
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
            .selectinload(ProjectPrimer.primer),
            selectinload(Project.primer_links)
            .selectinload(ProjectPrimer.primer)
            .selectinload(Primer.tubes),
            selectinload(Project.genes),
        )
    )
    project = (await session.execute(query)).scalar_one_or_none()
    if not project:
        return None
    primers = [
        _project_primer_dict(link.primer)
        for link in project.primer_links
        if link.primer
    ]
    genes = sorted(project.genes, key=lambda g: g.sort_order)
    counts = await _get_counts(session, project.id)
    return {
        **_project_dict(project),
        **counts,
        "primers": primers,
        "genes": genes,
    }


async def create_project(
    session: AsyncSession, data: ProjectCreate,
) -> Project:
    payload = data.model_dump()
    payload["sort_order"] = await sort_ordering.next_sort_order(session, Project)
    project = Project(**payload)
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


async def reorder_projects(
    session: AsyncSession, project_ids: list[int],
) -> None:
    await sort_ordering.reorder_subset(
        session, Project, project_ids, entity_label="项目",
    )
    await session.commit()


async def move_project(
    session: AsyncSession, project_id: int, target_sort_order: int,
) -> None:
    await sort_ordering.move_item(
        session, Project, project_id, target_sort_order, entity_label="项目",
    )
    await session.commit()


async def delete_project(session: AsyncSession, project: Project) -> None:
    counts = await _get_counts(session, project.id)
    if counts["primer_count"] > 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="项目仍有关联引物探针，请先解除关联后再删除",
        )
    old_order = project.sort_order
    await session.delete(project)
    await session.flush()
    await sort_ordering.compact_after_delete(session, Project, old_order)
    await session.commit()


async def add_primer_to_project(
    session: AsyncSession, project_id: int, primer_id: int,
) -> ProjectPrimer:
    link = ProjectPrimer(project_id=project_id, primer_id=primer_id)
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link


async def remove_primer_from_project(
    session: AsyncSession, project_id: int, primer_id: int,
) -> None:
    query = select(ProjectPrimer).where(
        ProjectPrimer.project_id == project_id,
        ProjectPrimer.primer_id == primer_id,
    )
    link = (await session.execute(query)).scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Link not found")
    await session.delete(link)
    await session.commit()


async def get_primer_projects(
    session: AsyncSession, primer_id: int,
) -> list[dict]:
    query = (
        select(Project)
        .join(ProjectPrimer)
        .where(ProjectPrimer.primer_id == primer_id)
    )
    projects = (await session.execute(query)).scalars().all()
    return [{"id": p.id, "name": p.name} for p in projects]


async def add_gene(
    session: AsyncSession, project_id: int, data: ProjectGeneCreate,
) -> ProjectGene:
    next_order = await sort_ordering.next_sort_order(
        session, ProjectGene,
        filters=(ProjectGene.project_id == project_id,),
    )
    gene = ProjectGene(
        project_id=project_id,
        **data.model_dump(),
        sort_order=next_order,
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
    await sort_ordering.reorder_subset(
        session, ProjectGene, gene_ids,
        filters=(ProjectGene.project_id == project_id,),
        entity_label="项目基因",
    )
    await session.commit()
    return await list_genes(session, project_id)


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
    primer_count = (
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
    return {"primer_count": primer_count, "gene_count": gene_count}


def _project_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "sort_order": p.sort_order,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


def _project_primer_dict(primer: Primer) -> dict:
    active_tubes = [tube for tube in primer.tubes if tube.status == "active"]
    total_remaining = sum(tube.remaining_volume_ul for tube in active_tubes)
    return {
        "id": primer.id,
        "name": primer.name,
        "sequence": primer.sequence,
        "base_count": primer.base_count,
        "type": primer.type,
        "modification_5prime": primer.modification_5prime,
        "modification_3prime": primer.modification_3prime,
        "mw": primer.mw,
        "ug_per_od": primer.ug_per_od,
        "nmol_per_od": primer.nmol_per_od,
        "gc_percent": primer.gc_percent,
        "tm": primer.tm,
        "purification_method": primer.purification_method,
        "active_tube_count": len(active_tubes),
        "total_remaining_volume_ul": total_remaining,
        "low_volume_alert_threshold_ul": primer.low_volume_alert_threshold_ul,
    }
