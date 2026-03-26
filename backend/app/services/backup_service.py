import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, status

from app.config import settings
from app.schemas.import_data import DatabaseBackupResponse

SQLITE_PREFIXES = ("sqlite+aiosqlite:///", "sqlite:///")


def backup_database() -> DatabaseBackupResponse:
    source_path = _resolve_sqlite_path(settings.DATABASE_URL)
    if not source_path.exists():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"数据库文件不存在: {source_path}",
        )
    backup_dir = _resolve_backup_dir()
    backup_dir.mkdir(parents=True, exist_ok=True)
    created_at = datetime.now(timezone.utc)
    file_name = f"primer_manager_backup_{created_at:%Y%m%d_%H%M%S}.db"
    target_path = backup_dir / file_name
    _run_sqlite_backup(source_path, target_path)
    return DatabaseBackupResponse(
        file_name=file_name,
        file_path=str(target_path.resolve()),
        size_bytes=target_path.stat().st_size,
        created_at=created_at,
    )


def _resolve_sqlite_path(database_url: str) -> Path:
    for prefix in SQLITE_PREFIXES:
        if not database_url.startswith(prefix):
            continue
        path_text = database_url[len(prefix):]
        if path_text == ":memory:":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="内存数据库不支持文件备份",
            )
        path = Path(path_text)
        return path if path.is_absolute() else (Path.cwd() / path).resolve()
    raise HTTPException(
        status.HTTP_400_BAD_REQUEST,
        detail="当前仅支持 SQLite 数据库备份",
    )


def _resolve_backup_dir() -> Path:
    configured_dir = Path(settings.DATABASE_BACKUP_DIR)
    if configured_dir.is_absolute():
        return configured_dir
    return (Path.cwd() / configured_dir).resolve()


def _run_sqlite_backup(source_path: Path, target_path: Path) -> None:
    with sqlite3.connect(str(source_path)) as source_conn, sqlite3.connect(str(target_path)) as target_conn:
        source_conn.backup(target_conn)
