from datetime import date, datetime
from pydantic import BaseModel


class TubeCreate(BaseModel):
    batch_number: str
    dissolution_date: date | None = None
    initial_volume_ul: float
    project: str | None = None


class TubeUpdate(BaseModel):
    batch_number: str | None = None
    dissolution_date: date | None = None
    initial_volume_ul: float | None = None
    remaining_volume_ul: float | None = None
    project: str | None = None


class TubeMove(BaseModel):
    box_id: int
    row: int
    col: int


class TubePositionInfo(BaseModel):
    box_id: int
    box_name: str
    row: int
    col: int

    model_config = {"from_attributes": True}


class TubeResponse(BaseModel):
    id: int
    primer_id: int
    batch_number: str
    dissolution_date: date | None
    initial_volume_ul: float
    remaining_volume_ul: float
    status: str
    project: str | None
    position: TubePositionInfo | None = None
    primer_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
