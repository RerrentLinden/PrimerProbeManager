from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BoxPosition(Base):
    __tablename__ = "box_positions"
    __table_args__ = (
        UniqueConstraint("box_id", "row", "col", name="uq_box_row_col"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    box_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("freezer_boxes.id", ondelete="CASCADE"), index=True,
    )
    row: Mapped[int] = mapped_column(Integer)
    col: Mapped[int] = mapped_column(Integer)
    tube_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("primer_tubes.id", ondelete="CASCADE"), unique=True,
    )

    box: Mapped["FreezerBox"] = relationship(
        "FreezerBox", back_populates="positions",
    )
    tube: Mapped["PrimerTube"] = relationship(
        "PrimerTube", back_populates="position",
    )


from app.models.freezer_box import FreezerBox  # noqa: E402, F811
from app.models.primer_tube import PrimerTube  # noqa: E402, F811
