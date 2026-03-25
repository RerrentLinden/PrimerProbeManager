from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectPrimer(Base):
    __tablename__ = "project_primers"
    __table_args__ = (
        UniqueConstraint("project_id", "primer_id", name="uq_project_primer"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True,
    )
    primer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("primers.id", ondelete="CASCADE"), index=True,
    )

    project: Mapped["Project"] = relationship(
        "Project", back_populates="primer_links",
    )
    primer: Mapped["Primer"] = relationship("Primer")


from app.models.project import Project  # noqa: E402, F811
from app.models.primer import Primer  # noqa: E402, F811
