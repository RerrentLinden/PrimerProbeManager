from pydantic import BaseModel


class LoginRequest(BaseModel):
    token: str


class LoginResponse(BaseModel):
    valid: bool
    message: str


class StatsResponse(BaseModel):
    primer_count: int
    probe_count: int
    active_tube_count: int
    low_volume_count: int


class AlertTubeResponse(BaseModel):
    tube_id: int
    primer_name: str
    batch_number: str
    remaining_volume_ul: float
    initial_volume_ul: float

    model_config = {"from_attributes": True}
