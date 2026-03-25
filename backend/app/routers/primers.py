from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.primer import (
    PrimerCreate, PrimerUpdate, PrimerResponse,
    PrimerListResponse, PrimerDetailResponse,
)
from app.schemas.tube import TubeResponse
from app.services import primer_service

router = APIRouter(
    prefix="/api/primers", tags=["primers"], dependencies=[Depends(verify_token)],
)


@router.get("", response_model=PrimerListResponse)
async def list_primers(
    search: str | None = None,
    type: str | None = None,
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_session),
):
    items, total = await primer_service.list_primers(
        session, search=search, primer_type=type, page=page, page_size=page_size,
    )
    return PrimerListResponse(
        items=[_to_response(p) for p in items],
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
    return _to_response(primer)


@router.get("/{primer_id}", response_model=PrimerDetailResponse)
async def get_primer(
    primer_id: int,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    active_count = sum(1 for t in primer.tubes if t.status == "active")
    tubes = [_tube_response(t) for t in primer.tubes]
    resp = _to_response(primer)
    return PrimerDetailResponse(
        **resp.model_dump(), tubes=tubes, active_tube_count=active_count,
    )


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
    return _to_response(updated)


@router.delete("/{primer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_primer(
    primer_id: int,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    await primer_service.delete_primer(session, primer)


def _to_response(p) -> PrimerResponse:
    return PrimerResponse(
        id=p.id, name=p.name, sequence=p.sequence,
        base_count=p.base_count, type=p.type,
        modification_5prime=p.modification_5prime,
        modification_3prime=p.modification_3prime,
        mw=p.mw, ug_per_od=p.ug_per_od, nmol_per_od=p.nmol_per_od,
        gc_percent=p.gc_percent, tm=p.tm,
        purification_method=p.purification_method,
        created_at=p.created_at, updated_at=p.updated_at,
    )


def _tube_response(t) -> TubeResponse:
    from app.schemas.tube import TubePositionInfo
    pos = None
    if t.position:
        pos = TubePositionInfo(
            box_id=t.position.box_id,
            box_name="",
            row=t.position.row,
            col=t.position.col,
        )
    return TubeResponse(
        id=t.id, primer_id=t.primer_id, batch_number=t.batch_number,
        dissolution_date=t.dissolution_date,
        initial_volume_ul=t.initial_volume_ul,
        remaining_volume_ul=t.remaining_volume_ul,
        status=t.status, project=t.project,
        position=pos, primer_name=None,
        created_at=t.created_at, updated_at=t.updated_at,
    )
