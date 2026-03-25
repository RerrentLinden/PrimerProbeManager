from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.auth import verify_token
from app.database import get_session
from app.schemas.import_data import ImportPreviewResponse, ImportConfirmResponse
from app.services import import_service

router = APIRouter(
    prefix="/api/import", tags=["import"], dependencies=[Depends(verify_token)],
)

XLSX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


@router.get("/template")
async def download_template():
    content = import_service.generate_template()
    return StreamingResponse(
        io.BytesIO(content),
        media_type=XLSX_CONTENT_TYPE,
        headers={
            "Content-Disposition": 'attachment; filename="import_template.xlsx"',
        },
    )


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    return await import_service.parse_preview(session, file)


@router.post("/confirm", response_model=ImportConfirmResponse)
async def confirm_import(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    return await import_service.confirm_import(session, file)
