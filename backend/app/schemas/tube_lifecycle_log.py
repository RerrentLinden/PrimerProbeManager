from datetime import date, datetime

from pydantic import BaseModel


class TubeLifecycleLogResponse(BaseModel):
    id: int
    tube_id: int
    primer_id: int
    primer_name: str
    primer_type: str
    batch_number: str
    tube_number: str | None
    action: str
    title: str
    description: str
    from_position: str | None
    to_position: str | None
    volume_used_ul: float | None
    remaining_volume_ul: float | None
    purpose: str | None
    project_name: str | None
    archive_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TubeLifecycleLogExportRequest(BaseModel):
    preset: str | None = None
    start_date: date | None = None
    end_date: date | None = None
