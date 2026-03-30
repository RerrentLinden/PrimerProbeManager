from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # noqa: F401 — ensure all models are registered

from app.routers import (
    auth, primers, tubes, usage_logs, boxes, search, import_data, projects, stats,
    tube_lifecycle_logs,
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

    if "primers" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("primers")}
        if "low_volume_alert_threshold_ul" not in cols:
            conn.execute(text(
                "ALTER TABLE primers "
                "ADD COLUMN low_volume_alert_threshold_ul FLOAT"
            ))
        _migrate_primer_identity_indexes(conn)
        _ensure_sort_order_column(conn, "primers")

    if "freezer_boxes" in insp.get_table_names():
        _ensure_sort_order_column(conn, "freezer_boxes")

    if "projects" in insp.get_table_names():
        _ensure_sort_order_column(conn, "projects")

    if "project_genes" in insp.get_table_names():
        _migrate_project_genes_constraint(conn)

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


def _ensure_sort_order_column(conn, table_name: str) -> None:
    cols = {
        c["name"]
        for c in conn.exec_driver_sql(
            f"PRAGMA table_info('{table_name}')"
        ).mappings().all()
    }
    if "sort_order" in cols:
        return
    conn.exec_driver_sql(
        f"ALTER TABLE {table_name} ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0"
    )
    conn.exec_driver_sql(
        f"UPDATE {table_name} SET sort_order = ("
        f"SELECT COUNT(*) FROM {table_name} AS t2 "
        f"WHERE t2.id >= {table_name}.id)"
    )


def _migrate_project_genes_constraint(conn) -> None:
    """Replace uq_project_gene(project_id, gene_name) with uq_project_gene_position(project_id, tube_number, fluorescence_channel)."""
    unique_indexes = _list_unique_indexes(conn, "project_genes")
    has_old = any(set(cols) == {"project_id", "gene_name"} for _, cols in unique_indexes)
    has_new = any(set(cols) == {"project_id", "tube_number", "fluorescence_channel"} for _, cols in unique_indexes)
    if not has_old or has_new:
        return
    old_name = next(name for name, cols in unique_indexes if set(cols) == {"project_id", "gene_name"})
    if not old_name.startswith("sqlite_autoindex"):
        conn.exec_driver_sql(f'DROP INDEX "{old_name}"')
        conn.exec_driver_sql(
            "CREATE UNIQUE INDEX uq_project_gene_position "
            "ON project_genes(project_id, tube_number, fluorescence_channel)"
        )
    else:
        conn.exec_driver_sql("PRAGMA foreign_keys=OFF")
        conn.exec_driver_sql("PRAGMA legacy_alter_table=ON")
        conn.exec_driver_sql("ALTER TABLE project_genes RENAME TO project_genes_old")
        conn.exec_driver_sql(
            "CREATE TABLE project_genes ("
            "id INTEGER NOT NULL PRIMARY KEY,"
            "project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,"
            "gene_name VARCHAR NOT NULL,"
            "tube_number INTEGER,"
            "fluorescence_channel VARCHAR,"
            "sort_order INTEGER NOT NULL DEFAULT 0,"
            "CONSTRAINT uq_project_gene_position UNIQUE (project_id, tube_number, fluorescence_channel)"
            ")"
        )
        conn.exec_driver_sql(
            "INSERT INTO project_genes (id, project_id, gene_name, tube_number, fluorescence_channel, sort_order) "
            "SELECT id, project_id, gene_name, tube_number, fluorescence_channel, sort_order FROM project_genes_old"
        )
        conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_project_genes_project_id ON project_genes(project_id)")
        conn.exec_driver_sql("DROP TABLE project_genes_old")
        conn.exec_driver_sql("PRAGMA legacy_alter_table=OFF")
        conn.exec_driver_sql("PRAGMA foreign_keys=ON")


def _migrate_primer_identity_indexes(conn) -> None:
    unique_indexes = _list_unique_indexes(conn, "primers")
    has_composite_unique = any(columns == ["name", "mw"] for _, columns in unique_indexes)
    name_only_indexes = [name for name, columns in unique_indexes if columns == ["name"]]

    if has_composite_unique and not name_only_indexes:
        return

    if _drop_name_only_unique_indexes(conn, name_only_indexes):
        conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_primers_name ON primers(name)")
        conn.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_primer_name_mw ON primers(name, mw)"
        )
        return

    _rebuild_primers_table(conn)


def _drop_name_only_unique_indexes(conn, index_names: list[str]) -> bool:
    for index_name in index_names:
        if index_name.startswith("sqlite_autoindex"):
            return False
        quoted_name = index_name.replace('"', '""')
        conn.exec_driver_sql(f'DROP INDEX "{quoted_name}"')
    return True


def _list_unique_indexes(conn, table_name: str) -> list[tuple[str, list[str]]]:
    indexes = conn.exec_driver_sql(f"PRAGMA index_list('{table_name}')").mappings().all()
    unique_indexes: list[tuple[str, list[str]]] = []
    for index in indexes:
        if not index["unique"]:
            continue
        columns = conn.exec_driver_sql(
            f"PRAGMA index_info('{index['name']}')"
        ).mappings().all()
        unique_indexes.append((index["name"], [column["name"] for column in columns]))
    return unique_indexes


def _rebuild_primers_table(conn) -> None:
    conn.exec_driver_sql("PRAGMA foreign_keys=OFF")
    conn.exec_driver_sql("PRAGMA legacy_alter_table=ON")
    conn.exec_driver_sql("ALTER TABLE primers RENAME TO primers_old")
    conn.exec_driver_sql(
        "CREATE TABLE primers ("
        "id INTEGER NOT NULL PRIMARY KEY,"
        "name VARCHAR NOT NULL,"
        "sequence VARCHAR NOT NULL,"
        "base_count INTEGER NOT NULL,"
        "modification_5prime VARCHAR,"
        "modification_3prime VARCHAR,"
        "mw FLOAT,"
        "ug_per_od FLOAT,"
        "nmol_per_od FLOAT,"
        "gc_percent FLOAT,"
        "tm FLOAT,"
        "purification_method VARCHAR,"
        "low_volume_alert_threshold_ul FLOAT,"
        "sort_order INTEGER NOT NULL DEFAULT 0,"
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,"
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,"
        "CONSTRAINT uq_primer_name_mw UNIQUE (name, mw)"
        ")"
    )
    old_cols = {
        c["name"]
        for c in conn.exec_driver_sql(
            "PRAGMA table_info('primers_old')"
        ).mappings().all()
    }
    sort_expr = "sort_order" if "sort_order" in old_cols else "0"
    conn.exec_driver_sql(
        "INSERT INTO primers ("
        "id, name, sequence, base_count, modification_5prime, modification_3prime, "
        "mw, ug_per_od, nmol_per_od, gc_percent, tm, purification_method, "
        "low_volume_alert_threshold_ul, sort_order, created_at, updated_at"
        ") "
        "SELECT "
        "id, name, sequence, base_count, modification_5prime, modification_3prime, "
        "mw, ug_per_od, nmol_per_od, gc_percent, tm, purification_method, "
        f"low_volume_alert_threshold_ul, {sort_expr}, created_at, updated_at "
        "FROM primers_old"
    )
    conn.exec_driver_sql("CREATE INDEX ix_primers_name ON primers(name)")
    if sort_expr == "0":
        _ensure_sort_order_column(conn, "primers")
    conn.exec_driver_sql("DROP TABLE primers_old")
    conn.exec_driver_sql("PRAGMA legacy_alter_table=OFF")
    conn.exec_driver_sql("PRAGMA foreign_keys=ON")


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
app.include_router(tube_lifecycle_logs.router)
