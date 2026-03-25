from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.tube import (
    TubeCreate, TubeUpdate, TubeMove, TubeResponse, TubePositionInfo,
)
from app.services import tube_service, primer_service

router = APIRouter(tags=["tubes"], dependencies=[Depends(verify_token)])


@router.get("/api/primers/{primer_id}/tubes", response_model=list[TubeResponse])
async def list_tubes(
    primer_id: int,
    status_filter: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    tubes = await tube_service.list_tubes(
        session, primer_id, tube_status=status_filter,
    )
    return [_to_response(t) for t in tubes]


@router.post(
    "/api/primers/{primer_id}/tubes",
    response_model=TubeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_tube(
    primer_id: int,
    body: TubeCreate,
    session: AsyncSession = Depends(get_session),
):
    primer = await primer_service.get_primer(session, primer_id)
    if not primer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Primer not found")
    tube = await tube_service.create_tube(session, primer_id, body)
    return _to_response(tube)


@router.put("/api/tubes/{tube_id}", response_model=TubeResponse)
async def update_tube(
    tube_id: int,
    body: TubeUpdate,
    session: AsyncSession = Depends(get_session),
):
    tube = await tube_service.get_tube(session, tube_id)
    if not tube:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    updated = await tube_service.update_tube(session, tube, body)
    return _to_response(updated)


class ArchiveRequest(BaseModel):
    reason: str


@router.put("/api/tubes/{tube_id}/archive", response_model=TubeResponse)
async def archive_tube(
    tube_id: int,
    body: ArchiveRequest,
    session: AsyncSession = Depends(get_session),
):
    tube = await tube_service.get_tube(session, tube_id)
    if not tube:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    archived = await tube_service.archive_tube(session, tube, reason=body.reason)
    return _to_response(archived)


@router.put("/api/tubes/{tube_id}/move", response_model=TubeResponse)
async def move_tube(
    tube_id: int,
    body: TubeMove,
    session: AsyncSession = Depends(get_session),
):
    tube = await tube_service.get_tube(session, tube_id)
    if not tube:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    moved = await tube_service.move_tube(session, tube, body)
    return _to_response(moved)


def _to_response(t) -> TubeResponse:
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
    primer_name = t.primer.name if hasattr(t, "primer") and t.primer else None
    return TubeResponse(
        id=t.id, primer_id=t.primer_id, batch_number=t.batch_number,
        tube_number=t.tube_number, dissolution_date=t.dissolution_date,
        initial_volume_ul=t.initial_volume_ul,
        remaining_volume_ul=t.remaining_volume_ul,
        status=t.status, project=t.project,
        position=pos, primer_name=primer_name,
        created_at=t.created_at, updated_at=t.updated_at,
    )
