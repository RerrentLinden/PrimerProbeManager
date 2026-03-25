from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.search import SearchResponse
from app.schemas.tube import TubeResponse, TubePositionInfo
from app.services import search_service

router = APIRouter(
    prefix="/api/search", tags=["search"], dependencies=[Depends(verify_token)],
)


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1),
    type: str = "all",
    session: AsyncSession = Depends(get_session),
):
    result = await search_service.global_search(session, q, search_type=type)
    result["tubes"] = [_tube_response(t) for t in result["tubes"]]
    return result


def _tube_response(t) -> TubeResponse:
    pos = None
    if t.position:
        box = t.position.box if hasattr(t.position, "box") else None
        pos = TubePositionInfo(
            box_id=t.position.box_id,
            box_name=box.name if box else "",
            row=t.position.row,
            col=t.position.col,
        )
    primer_name = t.primer.name if hasattr(t, "primer") and t.primer else None
    return TubeResponse(
        id=t.id, primer_id=t.primer_id, batch_number=t.batch_number,
        dissolution_date=t.dissolution_date,
        initial_volume_ul=t.initial_volume_ul,
        remaining_volume_ul=t.remaining_volume_ul,
        status=t.status, project=t.project,
        position=pos, primer_name=primer_name,
        created_at=t.created_at, updated_at=t.updated_at,
    )
