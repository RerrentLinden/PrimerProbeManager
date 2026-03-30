from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

DEFAULT_ROWS = 9
DEFAULT_COLS = 9


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FreezerBox(Base):
    __tablename__ = "freezer_boxes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    rows: Mapped[int] = mapped_column(Integer, default=DEFAULT_ROWS)
    cols: Mapped[int] = mapped_column(Integer, default=DEFAULT_COLS)
    storage_location: Mapped[str | None] = mapped_column(String, nullable=True)
    storage_temperature: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow,
        server_default=func.now(),
    )

    positions: Mapped[list["BoxPosition"]] = relationship(
        "BoxPosition", back_populates="box", cascade="all, delete-orphan",
    )


from app.models.box_position import BoxPosition  # noqa: E402, F811
