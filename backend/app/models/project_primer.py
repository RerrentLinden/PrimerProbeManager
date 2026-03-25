from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectPrimer(Base):
    __tablename__ = "project_primers"
    __table_args__ = (
        UniqueConstraint("project_id", "tube_id", name="uq_project_tube"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True,
    )
    tube_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("primer_tubes.id", ondelete="CASCADE"), index=True,
    )

    project: Mapped["Project"] = relationship(
        "Project", back_populates="primer_links",
    )
    tube: Mapped["PrimerTube"] = relationship("PrimerTube")


from app.models.project import Project  # noqa: E402, F811
from app.models.primer_tube import PrimerTube  # noqa: E402, F811
