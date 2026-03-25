from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.search import SearchResponse
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
    return await search_service.global_search(session, q, search_type=type)
