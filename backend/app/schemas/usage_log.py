from datetime import date, datetime
from pydantic import BaseModel


class UsageLogCreate(BaseModel):
    volume_used_ul: float
    purpose: str | None = None
    project: str | None = None
    usage_date: date | None = None


class UsageLogResponse(BaseModel):
    id: int
    tube_id: int
    usage_date: date
    volume_used_ul: float
    purpose: str | None
    project: str | None
    remaining_after_ul: float
    created_at: datetime

    model_config = {"from_attributes": True}
