from datetime import date, datetime, timezone

from sqlalchemy import String, Float, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tube_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("primer_tubes.id", ondelete="CASCADE"), index=True,
    )
    usage_date: Mapped[date] = mapped_column(Date)
    volume_used_ul: Mapped[float] = mapped_column(Float)
    purpose: Mapped[str | None] = mapped_column(String, nullable=True)
    project: Mapped[str | None] = mapped_column(String, nullable=True)
    remaining_after_ul: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )

    tube: Mapped["PrimerTube"] = relationship("PrimerTube", back_populates="usage_logs")


from app.models.primer_tube import PrimerTube  # noqa: E402, F811
