from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # noqa: F401 — ensure all models are registered

from app.routers import (
    auth, primers, tubes, usage_logs, boxes, search, import_data, projects, stats,
)


def _migrate(conn) -> None:
    """Add columns / rebuild tables that may differ from earlier schema."""
    from sqlalchemy import text, inspect as sa_inspect
    insp = sa_inspect(conn)

    if "primer_tubes" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("primer_tubes")}
        if "tube_number" not in cols:
            conn.execute(text("ALTER TABLE primer_tubes ADD COLUMN tube_number VARCHAR"))
        if "archive_reason" not in cols:
            conn.execute(text("ALTER TABLE primer_tubes ADD COLUMN archive_reason VARCHAR"))

    if "project_primers" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("project_primers")}
        if "primer_id" not in cols:
            conn.execute(text("DROP TABLE project_primers"))
            conn.execute(text(
                "CREATE TABLE project_primers ("
                "  id INTEGER PRIMARY KEY,"
                "  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,"
                "  primer_id INTEGER NOT NULL REFERENCES primers(id) ON DELETE CASCADE,"
                "  UNIQUE(project_id, primer_id)"
                ")"
            ))
            conn.execute(text("CREATE INDEX ix_project_primers_project_id ON project_primers(project_id)"))
            conn.execute(text("CREATE INDEX ix_project_primers_primer_id ON project_primers(primer_id)"))


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    Path("data").mkdir(exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate)
    yield


app = FastAPI(title="PrimerManager", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(primers.router)
app.include_router(tubes.router)
app.include_router(usage_logs.router)
app.include_router(boxes.router)
app.include_router(search.router)
app.include_router(import_data.router)
app.include_router(projects.router)
app.include_router(stats.router)
