from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.primer import (
    PrimerCreate, PrimerUpdate, PrimerResponse,
    PrimerListResponse, PrimerDetailResponse,
)
from app.schemas.tube import TubeResponse
from app.services import primer_service, project_service
from app.models.primer import Primer
from app.schemas.primer import PrimerProjectInfo

router = APIRouter(
    prefix="/api/primers", tags=["primers"], dependencies=[Depends(verify_token)],
)


@router.get("/modifications", response_model=dict[str, list[str]])
async def list_modifications(session: AsyncSession = Depends(get_session)):
    from sqlalchemy import select, distinct
    q5 = select(distinct(Primer.modification_5prime)).where(
        Primer.modification_5prime.isnot(None),
    )
    q3 = select(distinct(Primer.modification_3prime)).where(
        Primer.modification_3prime.isnot(None),
    )
    mods_5 = sorted((await session.execute(q5)).scalars().all())
    mods_3 = sorted((await session.execute(q3)).scalars().all())
    return {"five_prime": mods_5, "three_prime": mods_3}


@router.get("", response_model=PrimerListResponse)
async def list_primers(
    search: str | None = None,
    search_field: str | None = None,
    type: str | None = None,
    mod_5: str | None = None,
    mod_3: str | None = None,
    project_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_session),
):
    items, total = await primer_service.list_primers(
        session,
        search=search,
        search_field=search_field,
        primer_type=type,
        mod_5=mod_5,
        mod_3=mod_3,
        project_id=project_id,
        page=page,
        page_size=page_size,
    )
    responses = []
    for p in items:
        proj_list = await project_service.get_primer_projects(session, p.id)
        responses.append(_to_response(p, proj_list))
    return PrimerListResponse(
        items=responses,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=PrimerResponse, status_code=status.HTTP_201_CREATED)
async def create_primer(
    body: PrimerCreate,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.create_primer(session, body)
    return _to_response(primer, [])


@router.get("/{primer_id}", response_model=PrimerDetailResponse)
async def get_primer(
    primer_id: int,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    tubes = [_tube_response(t) for t in primer.tubes]
    proj_list = await project_service.get_primer_projects(session, primer.id)
    resp = _to_response(primer, proj_list)
    return PrimerDetailResponse(**resp.model_dump(), tubes=tubes)


@router.put("/{primer_id}", response_model=PrimerResponse)
async def update_primer(
    primer_id: int,
    body: PrimerUpdate,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    updated = await primer_service.update_primer(session, primer, body)
    proj_list = await project_service.get_primer_projects(session, updated.id)
    return _to_response(updated, proj_list)


@router.delete("/{primer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_primer(
    primer_id: int,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    await primer_service.delete_primer(session, primer)


def _to_response(p, proj_list: list[dict]) -> PrimerResponse:
    active = sum(1 for t in p.tubes if t.status == "active") if p.tubes else 0
    return PrimerResponse(
        id=p.id, name=p.name, sequence=p.sequence,
        base_count=p.base_count, type=p.type,
        modification_5prime=p.modification_5prime,
        modification_3prime=p.modification_3prime,
        mw=p.mw, ug_per_od=p.ug_per_od, nmol_per_od=p.nmol_per_od,
        gc_percent=p.gc_percent, tm=p.tm,
        purification_method=p.purification_method,
        active_tube_count=active,
        projects=[PrimerProjectInfo(**pj) for pj in proj_list],
        created_at=p.created_at, updated_at=p.updated_at,
    )


def _tube_response(t) -> TubeResponse:
    from app.schemas.tube import TubePositionInfo
    pos = None
    if t.position:
        box = t.position.box if hasattr(t.position, "box") and t.position.box else None
        pos = TubePositionInfo(
            box_id=t.position.box_id,
            box_name=box.name if box else "",
            storage_location=box.storage_location if box else None,
            storage_temperature=box.storage_temperature if box else None,
            row=t.position.row,
            col=t.position.col,
        )
    return TubeResponse(
        id=t.id, primer_id=t.primer_id, batch_number=t.batch_number,
        tube_number=t.tube_number, dissolution_date=t.dissolution_date,
        initial_volume_ul=t.initial_volume_ul,
        remaining_volume_ul=t.remaining_volume_ul,
        status=t.status, project=t.project,
        position=pos, primer_name=None,
        created_at=t.created_at, updated_at=t.updated_at,
    )
