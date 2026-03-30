from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse,
    ProjectPrimerInfo,
    ProjectGeneCreate, ProjectGeneUpdate, ProjectGeneResponse,
    GeneReorderRequest, AddPrimerRequest,
    ProjectReorderRequest, ProjectMoveRequest,
)
from app.services import project_service

router = APIRouter(
    prefix="/api/projects", tags=["projects"],
    dependencies=[Depends(verify_token)],
)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    search: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await project_service.list_projects(session, search=search)


@router.put("/reorder")
async def reorder_projects(
    body: ProjectReorderRequest,
    session: AsyncSession = Depends(get_session),
):
    await project_service.reorder_projects(session, body.ordered_ids)
    return {"ok": True}


@router.post(
    "", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED,
)
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(get_session),
):
    p = await project_service.create_project(session, body)
    return ProjectResponse(
        id=p.id, sort_order=p.sort_order,
        name=p.name, description=p.description,
        created_at=p.created_at, updated_at=p.updated_at,
    )


@router.put("/{project_id}/sort-order")
async def move_project_sort_order(
    project_id: int,
    body: ProjectMoveRequest,
    session: AsyncSession = Depends(get_session),
):
    await project_service.move_project(session, project_id, body.sort_order)
    return {"ok": True}


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    data = await project_service.get_project(session, project_id)
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")
    data["primers"] = [ProjectPrimerInfo(**p) for p in data.get("primers", [])]
    return data


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
):
    project = await project_service.get_project_raw(session, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")
    updated = await project_service.update_project(session, project, body)
    return ProjectResponse(
        id=updated.id, sort_order=updated.sort_order,
        name=updated.name, description=updated.description,
        created_at=updated.created_at, updated_at=updated.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    project = await project_service.get_project_raw(session, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")
    await project_service.delete_project(session, project)


@router.post("/{project_id}/primers", status_code=status.HTTP_201_CREATED)
async def add_primer_to_project(
    project_id: int,
    body: AddPrimerRequest,
    session: AsyncSession = Depends(get_session),
):
    await project_service.add_primer_to_project(session, project_id, body.primer_id)
    return {"ok": True}


@router.delete(
    "/{project_id}/primers/{primer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_primer_from_project(
    project_id: int, primer_id: int,
    session: AsyncSession = Depends(get_session),
):
    await project_service.remove_primer_from_project(session, project_id, primer_id)


@router.get(
    "/{project_id}/genes", response_model=list[ProjectGeneResponse],
)
async def list_genes(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await project_service.list_genes(session, project_id)


@router.post(
    "/{project_id}/genes",
    response_model=ProjectGeneResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_gene(
    project_id: int,
    body: ProjectGeneCreate,
    session: AsyncSession = Depends(get_session),
):
    return await project_service.add_gene(session, project_id, body)


@router.put(
    "/{project_id}/genes/reorder",
    response_model=list[ProjectGeneResponse],
)
async def reorder_genes(
    project_id: int,
    body: GeneReorderRequest,
    session: AsyncSession = Depends(get_session),
):
    return await project_service.reorder_genes(session, project_id, body.gene_ids)


@router.put(
    "/{project_id}/genes/{gene_id}", response_model=ProjectGeneResponse,
)
async def update_gene(
    project_id: int, gene_id: int,
    body: ProjectGeneUpdate,
    session: AsyncSession = Depends(get_session),
):
    gene = await project_service.get_gene(session, gene_id)
    if not gene or gene.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Gene not found")
    return await project_service.update_gene(session, gene, body)


@router.delete(
    "/{project_id}/genes/{gene_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_gene(
    project_id: int, gene_id: int,
    session: AsyncSession = Depends(get_session),
):
    gene = await project_service.get_gene(session, gene_id)
    if not gene or gene.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Gene not found")
    await project_service.delete_gene(session, gene)
