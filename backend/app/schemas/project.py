from datetime import datetime
from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    primer_count: int = 0
    gene_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectPrimerInfo(BaseModel):
    id: int
    name: str
    type: str
    sequence: str
    base_count: int
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

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    primers: list[ProjectPrimerInfo] = []
    genes: list["ProjectGeneResponse"] = []


class ProjectGeneCreate(BaseModel):
    gene_name: str
    tube_number: int | None = None
    fluorescence_channel: str | None = None


class ProjectGeneUpdate(BaseModel):
    gene_name: str | None = None
    tube_number: int | None = None
    fluorescence_channel: str | None = None


class ProjectGeneResponse(BaseModel):
    id: int
    project_id: int
    gene_name: str
    tube_number: int | None
    fluorescence_channel: str | None
    sort_order: int

    model_config = {"from_attributes": True}


class GeneReorderRequest(BaseModel):
    gene_ids: list[int]


class AddPrimerRequest(BaseModel):
    primer_id: int


ProjectDetailResponse.model_rebuild()
