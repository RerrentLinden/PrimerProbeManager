from datetime import date, datetime, timezone

from sqlalchemy import (
    String, Float, Integer, Date, DateTime, ForeignKey, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

DEFAULT_STATUS = "active"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PrimerTube(Base):
    __tablename__ = "primer_tubes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    primer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("primers.id", ondelete="CASCADE"), index=True,
    )
    batch_number: Mapped[str] = mapped_column(String)
    dissolution_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    initial_volume_ul: Mapped[float] = mapped_column(Float)
    remaining_volume_ul: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String, default=DEFAULT_STATUS)
    project: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow,
        server_default=func.now(),
    )

    primer: Mapped["Primer"] = relationship("Primer", back_populates="tubes")
    usage_logs: Mapped[list["UsageLog"]] = relationship(
        "UsageLog", back_populates="tube", cascade="all, delete-orphan",
    )
    position: Mapped["BoxPosition | None"] = relationship(
        "BoxPosition", back_populates="tube", uselist=False,
        cascade="all, delete-orphan",
    )


from app.models.primer import Primer  # noqa: E402, F811
from app.models.usage_log import UsageLog  # noqa: E402, F811
from app.models.box_position import BoxPosition  # noqa: E402, F811
