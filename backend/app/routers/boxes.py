from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.box import (
    BoxCreate, BoxUpdate, BoxResponse, BoxDetailResponse,
    PlaceRequest, BoxMoveRequest,
)
from app.services import box_service

router = APIRouter(
    prefix="/api/boxes", tags=["boxes"], dependencies=[Depends(verify_token)],
)


@router.get("/search-tubes")
async def search_placed_tubes(
    q: str,
    session: AsyncSession = Depends(get_session),
):
    """Search tubes placed in boxes by primer name or batch number."""
    from sqlalchemy import select, or_
    from app.models.box_position import BoxPosition
    from app.models.primer_tube import PrimerTube
    from app.models.primer import Primer
    from app.models.freezer_box import FreezerBox as FBox
    pattern = f"%{q}%"
    query = (
        select(
            BoxPosition.box_id,
            FBox.name,
            BoxPosition.row,
            BoxPosition.col,
            Primer.name.label("primer_name"),
            PrimerTube.batch_number,
            PrimerTube.tube_number,
        )
        .join(PrimerTube, BoxPosition.tube_id == PrimerTube.id)
        .join(Primer, PrimerTube.primer_id == Primer.id)
        .join(FBox, BoxPosition.box_id == FBox.id)
        .where(or_(
            Primer.name.ilike(pattern),
            PrimerTube.batch_number.ilike(pattern),
        ))
        .limit(20)
    )
    rows = (await session.execute(query)).all()
    return [
        {
            "box_id": r.box_id,
            "box_name": r.name,
            "row": r.row,
            "col": r.col,
            "primer_name": r.primer_name,
            "batch_number": r.batch_number,
            "tube_number": r.tube_number,
        }
        for r in rows
    ]


@router.get("", response_model=list[BoxResponse])
async def list_boxes(
    search: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await box_service.list_boxes(session, search=search)


@router.post("", response_model=BoxResponse, status_code=status.HTTP_201_CREATED)
async def create_box(
    body: BoxCreate,
    session: AsyncSession = Depends(get_session),
):
    box = await box_service.create_box(session, body)
    return BoxResponse(
        id=box.id, name=box.name, rows=box.rows, cols=box.cols,
        storage_location=box.storage_location,
        storage_temperature=box.storage_temperature,
        occupied_count=0,
        created_at=box.created_at, updated_at=box.updated_at,
    )


@router.get("/{box_id}", response_model=BoxDetailResponse)
async def get_box(
    box_id: int,
    session: AsyncSession = Depends(get_session),
):
    box = await box_service.get_box(session, box_id)
    if not box:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Box not found")
    grid = box_service.build_grid(box)
    occupied = sum(1 for pos in box.positions)
    return BoxDetailResponse(
        id=box.id, name=box.name, rows=box.rows, cols=box.cols,
        storage_location=box.storage_location,
        storage_temperature=box.storage_temperature,
        occupied_count=occupied, grid=grid,
        created_at=box.created_at, updated_at=box.updated_at,
    )


@router.put("/{box_id}", response_model=BoxResponse)
async def update_box(
    box_id: int,
    body: BoxUpdate,
    session: AsyncSession = Depends(get_session),
):
    box = await box_service.get_box(session, box_id)
    if not box:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Box not found")
    updated = await box_service.update_box(session, box, body)
    occupied = sum(1 for _ in updated.positions)
    return BoxResponse(
        id=updated.id, name=updated.name, rows=updated.rows, cols=updated.cols,
        storage_location=updated.storage_location,
        storage_temperature=updated.storage_temperature,
        occupied_count=occupied,
        created_at=updated.created_at, updated_at=updated.updated_at,
    )


@router.delete("/{box_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_box(
    box_id: int,
    session: AsyncSession = Depends(get_session),
):
    box = await box_service.get_box(session, box_id)
    if not box:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Box not found")
    if box.positions:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="冻存盒内仍有管，请先清空后再删除",
        )
    await box_service.delete_box(session, box)


@router.put("/{box_id}/positions/{row}/{col}/place")
async def place_tube(
    box_id: int, row: int, col: int,
    body: PlaceRequest,
    session: AsyncSession = Depends(get_session),
):
    await box_service.place_tube(session, box_id, row, col, body.tube_id)
    return {"ok": True}


@router.put("/{box_id}/positions/{row}/{col}/remove")
async def remove_tube(
    box_id: int, row: int, col: int,
    session: AsyncSession = Depends(get_session),
):
    await box_service.remove_from_position(session, box_id, row, col)
    return {"ok": True}


@router.post("/{box_id}/positions/move")
async def move_position(
    box_id: int,
    body: BoxMoveRequest,
    session: AsyncSession = Depends(get_session),
):
    await box_service.move_within_box(session, box_id, body)
    return {"ok": True}
