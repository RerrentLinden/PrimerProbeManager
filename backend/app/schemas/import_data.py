from pydantic import BaseModel


class PrimerPreviewRow(BaseModel):
    name: str
    sequence: str
    modification_5prime: str | None = None
    modification_3prime: str | None = None
    mw: float | None = None
    ug_per_od: float | None = None
    nmol_per_od: float | None = None
    gc_percent: float | None = None
    tm: float | None = None
    purification_method: str | None = None
    action: str  # "create" | "update" | "conflict"
    message: str | None = None


class TubePreviewRow(BaseModel):
    primer_name: str
    batch_number: str
    dissolution_date: str | None = None
    initial_volume_ul: float
    project: str | None = None
    action: str  # "create" | "update" | "error"
    message: str | None = None


class ImportPreviewResponse(BaseModel):
    primers: list[PrimerPreviewRow]
    tubes: list[TubePreviewRow]
    primer_create_count: int
    primer_update_count: int
    tube_create_count: int
    tube_update_count: int
    error_count: int


class ImportConfirmResponse(BaseModel):
    primers_created: int
    primers_updated: int
    tubes_created: int
    tubes_updated: int
