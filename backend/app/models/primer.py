from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Primer(Base):
    __tablename__ = "primers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    sequence: Mapped[str] = mapped_column(String)
    base_count: Mapped[int] = mapped_column(Integer)
    modification_5prime: Mapped[str | None] = mapped_column(String, nullable=True)
    modification_3prime: Mapped[str | None] = mapped_column(String, nullable=True)
    mw: Mapped[float | None] = mapped_column(Float, nullable=True)
    ug_per_od: Mapped[float | None] = mapped_column(Float, nullable=True)
    nmol_per_od: Mapped[float | None] = mapped_column(Float, nullable=True)
    gc_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    tm: Mapped[float | None] = mapped_column(Float, nullable=True)
    purification_method: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow,
        server_default=func.now(),
    )

    tubes: Mapped[list["PrimerTube"]] = relationship(
        "PrimerTube", back_populates="primer", cascade="all, delete-orphan",
    )

    @hybrid_property
    def type(self) -> str:
        if self.modification_5prime or self.modification_3prime:
            return "probe"
        return "primer"


from app.models.primer_tube import PrimerTube  # noqa: E402, F811
