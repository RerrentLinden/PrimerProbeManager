from datetime import datetime
from pydantic import BaseModel, Field


class PrimerCreate(BaseModel):
    name: str
    sequence: str
    modification_5prime: str | None
    modification_3prime: str | None
    mw: float
    ug_per_od: float | None = None
    nmol_per_od: float | None = None
    gc_percent: float | None = None
    tm: float | None = None
    purification_method: str | None = None
    low_volume_alert_threshold_ul: float | None = None


class PrimerUpdate(BaseModel):
    name: str | None = None
    sequence: str | None = None
    modification_5prime: str | None = None
    modification_3prime: str | None = None
    mw: float | None = None
    ug_per_od: float | None = None
    nmol_per_od: float | None = None
    gc_percent: float | None = None
    tm: float | None = None
    purification_method: str | None = None
    low_volume_alert_threshold_ul: float | None = None


class PrimerProjectInfo(BaseModel):
    id: int
    name: str


class PrimerResponse(BaseModel):
    id: int
    name: str
    sequence: str
    base_count: int
    type: str
    modification_5prime: str | None
    modification_3prime: str | None
    mw: float | None
    ug_per_od: float | None
    nmol_per_od: float | None
    gc_percent: float | None
    tm: float | None
    purification_method: str | None
    active_tube_count: int = 0
    total_remaining_volume_ul: float = 0
    low_volume_alert_threshold_ul: float | None = None
    projects: list[PrimerProjectInfo] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrimerListResponse(BaseModel):
    items: list[PrimerResponse]
    total: int
    page: int
    page_size: int


class PrimerDetailResponse(PrimerResponse):
    tubes: list["TubeResponse"] = Field(default_factory=list)


from app.schemas.tube import TubeResponse  # noqa: E402

PrimerDetailResponse.model_rebuild()
