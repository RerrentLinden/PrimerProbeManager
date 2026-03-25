from datetime import date

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.tube_lifecycle_log import TubeLifecycleLogResponse
from app.services import tube_lifecycle_log_service

router = APIRouter(
    prefix="/api/tube-lifecycle-logs",
    tags=["tube_lifecycle_logs"],
    dependencies=[Depends(verify_token)],
)


@router.get("", response_model=list[TubeLifecycleLogResponse])
async def list_tube_lifecycle_logs(
    preset: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await tube_lifecycle_log_service.list_logs(
        session,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/export")
async def export_tube_lifecycle_logs(
    preset: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    filename, content = await tube_lifecycle_log_service.export_logs_txt(
        session,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="text/plain; charset=utf-8", headers=headers)
