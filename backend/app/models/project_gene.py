from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectGene(Base):
    __tablename__ = "project_genes"
    __table_args__ = (
        UniqueConstraint("project_id", "gene_name", name="uq_project_gene"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True,
    )
    gene_name: Mapped[str] = mapped_column(String)
    tube_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fluorescence_channel: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped["Project"] = relationship(
        "Project", back_populates="genes",
    )


from app.models.project import Project  # noqa: E402, F811
