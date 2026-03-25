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

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    primers: list[ProjectPrimerInfo] = []
    genes: list["ProjectGeneResponse"] = []


class ProjectGeneCreate(BaseModel):
    gene_name: str
    tube_number: int | None = None
    fluorescence_channel: str | None = None
    function_note: str | None = None


class ProjectGeneUpdate(BaseModel):
    gene_name: str | None = None
    tube_number: int | None = None
    fluorescence_channel: str | None = None
    function_note: str | None = None


class ProjectGeneResponse(BaseModel):
    id: int
    project_id: int
    gene_name: str
    tube_number: int | None
    fluorescence_channel: str | None
    function_note: str | None
    sort_order: int

    model_config = {"from_attributes": True}


class GeneReorderRequest(BaseModel):
    gene_ids: list[int]


class AddPrimerRequest(BaseModel):
    primer_id: int


ProjectDetailResponse.model_rebuild()
