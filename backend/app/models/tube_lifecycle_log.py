from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TubeLifecycleLog(Base):
    __tablename__ = "tube_lifecycle_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tube_id: Mapped[int] = mapped_column(Integer, index=True)
    primer_id: Mapped[int] = mapped_column(Integer, index=True)
    primer_name: Mapped[str] = mapped_column(String)
    primer_type: Mapped[str] = mapped_column(String)
    batch_number: Mapped[str] = mapped_column(String)
    tube_number: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    from_position: Mapped[str | None] = mapped_column(String, nullable=True)
    to_position: Mapped[str | None] = mapped_column(String, nullable=True)
    volume_used_ul: Mapped[float | None] = mapped_column(Float, nullable=True)
    remaining_volume_ul: Mapped[float | None] = mapped_column(Float, nullable=True)
    purpose: Mapped[str | None] = mapped_column(String, nullable=True)
    project_name: Mapped[str | None] = mapped_column(String, nullable=True)
    archive_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )
