from pydantic import BaseModel

from app.schemas.primer import PrimerResponse
from app.schemas.tube import TubeResponse
from app.schemas.box import BoxResponse


class SearchResponse(BaseModel):
    primers: list[PrimerResponse]
    tubes: list[TubeResponse]
    boxes: list[BoxResponse]
