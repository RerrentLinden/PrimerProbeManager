from pydantic import BaseModel

from app.schemas.tube import TubePositionInfo


class SearchPrimerProjectInfo(BaseModel):
    id: int
    name: str


class SearchPrimerResult(BaseModel):
    id: int
    name: str
    sequence: str
    modification_5prime: str | None
    modification_3prime: str | None
    type: str
    mw: float | None
    projects: list[SearchPrimerProjectInfo] = []


class SearchTubeResult(BaseModel):
    id: int
    primer_id: int
    primer_name: str
    batch_number: str
    tube_number: str | None
    position: TubePositionInfo | None = None


class SearchBoxResult(BaseModel):
    id: int
    name: str
    storage_location: str | None


class SearchProjectResult(BaseModel):
    id: int
    name: str


class SearchResponse(BaseModel):
    primers: list[SearchPrimerResult]
    tubes: list[SearchTubeResult]
    boxes: list[SearchBoxResult]
    projects: list[SearchProjectResult]
