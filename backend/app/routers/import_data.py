import io
import json

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.database import get_session
from app.schemas.import_data import (
    ImportConfirmOptions,
    ImportConfirmResponse,
    ImportPreviewResponse,
)
from app.services import import_confirm_service, import_excel_service, import_preview_service

router = APIRouter(
    prefix="/api/import", tags=["import"], dependencies=[Depends(verify_token)],
)

XLSX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


@router.get("/template")
async def download_template():
    content = import_excel_service.generate_template()
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
    raw = await file.read()
    primer_rows, tube_rows = import_excel_service.parse_workbook(raw)
    return await import_preview_service.build_preview(
        session, primer_rows=primer_rows, tube_rows=tube_rows,
    )


@router.post("/confirm", response_model=ImportConfirmResponse)
async def confirm_import(
    file: UploadFile = File(...),
    options: str = Form("{}"),
    session: AsyncSession = Depends(get_session),
):
    raw = await file.read()
    primer_rows, tube_rows = import_excel_service.parse_workbook(raw)
    opts = ImportConfirmOptions(**json.loads(options))
    result = await import_confirm_service.apply_confirm(
        session, primer_rows=primer_rows, tube_rows=tube_rows, options=opts,
    )
    await session.commit()
    return result
