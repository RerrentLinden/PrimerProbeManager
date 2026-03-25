from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.usage_log import UsageLogCreate, UsageLogResponse
from app.services import tube_service

router = APIRouter(
    prefix="/api/tubes", tags=["usage_logs"], dependencies=[Depends(verify_token)],
)


@router.get("/{tube_id}/usage-logs", response_model=list[UsageLogResponse])
async def list_usage_logs(
    tube_id: int,
    session: AsyncSession = Depends(get_session),
):
    tube = await tube_service.get_tube(session, tube_id)
    if not tube:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    logs = await tube_service.list_usage_logs(session, tube_id)
    return logs


@router.post(
    "/{tube_id}/usage-logs",
    response_model=UsageLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_usage_log(
    tube_id: int,
    body: UsageLogCreate,
    session: AsyncSession = Depends(get_session),
):
    tube = await tube_service.get_tube(session, tube_id)
    if not tube:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tube not found")
    log = await tube_service.add_usage_log(session, tube, body)
    return log
