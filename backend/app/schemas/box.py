from datetime import datetime
from pydantic import BaseModel


class BoxCreate(BaseModel):
    name: str
    rows: int = 9
    cols: int = 9
    storage_location: str | None = None
    storage_temperature: str | None = None


class BoxUpdate(BaseModel):
    name: str | None = None
    rows: int | None = None
    cols: int | None = None
    storage_location: str | None = None
    storage_temperature: str | None = None


class BoxResponse(BaseModel):
    id: int
    name: str
    rows: int
    cols: int
    storage_location: str | None
    storage_temperature: str | None
    occupied_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SlotTubeInfo(BaseModel):
    tube_id: int
    primer_id: int
    primer_name: str
    primer_type: str
    batch_number: str
    tube_number: str | None = None
    remaining_volume_ul: float
    initial_volume_ul: float


class GridSlot(BaseModel):
    row: int
    col: int
    tube: SlotTubeInfo | None = None


class BoxDetailResponse(BoxResponse):
    grid: list[list[GridSlot]]


class PlaceRequest(BaseModel):
    tube_id: int


class BoxMoveRequest(BaseModel):
    from_row: int
    from_col: int
    to_row: int
    to_col: int
    to_box_id: int | None = None
