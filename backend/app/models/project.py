from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow,
        server_default=func.now(),
    )

    primer_links: Mapped[list["ProjectPrimer"]] = relationship(
        "ProjectPrimer", back_populates="project", cascade="all, delete-orphan",
    )
    genes: Mapped[list["ProjectGene"]] = relationship(
        "ProjectGene", back_populates="project", cascade="all, delete-orphan",
    )


from app.models.project_primer import ProjectPrimer  # noqa: E402, F811
from app.models.project_gene import ProjectGene  # noqa: E402, F811
