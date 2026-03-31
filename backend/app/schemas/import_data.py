from pydantic import BaseModel


class PrimerPreviewRow(BaseModel):
    row_number: int
    import_key: str
    name: str
    resolved_name: str | None = None
    sequence: str
    project_names: list[str] = []
    modification_5prime: str | None = None
    modification_3prime: str | None = None
    mw: float | None = None
    tm: float | None = None
    action: str
    message: str | None = None
    conflict_existing_name: str | None = None
    conflict_existing_sequence: str | None = None
    suggested_name: str | None = None
    available_strategies: list[str] = []


class TubePreviewRow(BaseModel):
    row_number: int
    import_key: str
    primer_name: str
    primer_mw: float | None = None
    batch_number: str
    tube_number: str | None = None
    dissolution_date: str | None = None
    initial_volume_ul: float
    box_name: str | None = None
    well_position: str | None = None
    placement_message: str | None = None
    action: str
    message: str | None = None


class ImportPreviewResponse(BaseModel):
    primers: list[PrimerPreviewRow]
    tubes: list[TubePreviewRow]
    primer_create_count: int
    primer_update_count: int
    primer_conflict_count: int = 0
    tube_create_count: int
    tube_update_count: int
    tube_conflict_count: int = 0
    tube_placement_count: int = 0
    error_count: int
    available_conflict_strategies: list[str] = []


class PrimerConflictResolution(BaseModel):
    import_key: str
    strategy: str
    renamed_name: str | None = None


class ImportConfirmOptions(BaseModel):
    default_conflict_strategy: str = "error"
    primer_conflict_resolutions: list[PrimerConflictResolution] = []


class ImportConfirmResponse(BaseModel):
    conflict_strategy: str
    primers_created: int
    primers_updated: int
    primers_renamed: int = 0
    primers_skipped: int = 0
    tubes_created: int
    tubes_updated: int
    tubes_skipped: int = 0
    tubes_placed: int = 0
