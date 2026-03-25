from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.box_position import BoxPosition
from app.models.freezer_box import FreezerBox
from app.models.primer_tube import PrimerTube
from app.models.tube_lifecycle_log import TubeLifecycleLog

DEFAULT_PRESET = "30d"
VALID_PRESETS = frozenset({"24h", "7d", "30d"})
DISPLAY_TIMEZONE = timezone(timedelta(hours=8))
ROW_LABELS = tuple("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


async def list_logs(
    session: AsyncSession,
    *,
    preset: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[TubeLifecycleLog]:
    window_start, window_end = _resolve_window(
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
    query = select(TubeLifecycleLog).order_by(
        TubeLifecycleLog.created_at.asc(),
        TubeLifecycleLog.id.asc(),
    )
    if window_start is not None:
        query = query.where(TubeLifecycleLog.created_at >= window_start)
    if window_end is not None:
        query = query.where(TubeLifecycleLog.created_at < window_end)
    return list((await session.execute(query)).scalars().all())


async def export_logs_txt(
    session: AsyncSession,
    *,
    preset: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[str, str]:
    logs = await list_logs(
        session,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
    label, suffix = _describe_window(
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
    lines = [
        "PPManager 引探分管生命周期日志",
        f"范围: {label}",
        f"导出时间: {_format_timestamp(datetime.now(timezone.utc))}",
        f"记录数: {len(logs)}",
        "",
    ]
    for log in logs:
        lines.extend(_render_log_lines(log))
    filename = f"tube-lifecycle-logs-{suffix}.txt"
    return filename, "\n".join(lines).strip() + "\n"


def stage_created_log(
    session: AsyncSession,
    *,
    tube: PrimerTube,
    primer_name: str,
    primer_type: str,
) -> None:
    description = (
        f"新增分管 {_tube_label(tube.batch_number, tube.tube_number)}，"
        f"初始体积 {tube.initial_volume_ul:.1f} uL"
    )
    _stage_log(
        session,
        tube=tube,
        primer_name=primer_name,
        primer_type=primer_type,
        action="created",
        title="分管添加入库",
        description=description,
        remaining_volume_ul=tube.remaining_volume_ul,
    )


def stage_usage_log(
    session: AsyncSession,
    *,
    tube: PrimerTube,
    primer_name: str,
    primer_type: str,
    volume_used_ul: float,
    remaining_volume_ul: float,
    purpose: str | None,
    project_name: str | None,
) -> None:
    description = (
        f"使用 {volume_used_ul:.1f} uL，"
        f"剩余 {remaining_volume_ul:.1f} uL"
    )
    _stage_log(
        session,
        tube=tube,
        primer_name=primer_name,
        primer_type=primer_type,
        action="used",
        title="分管使用消耗",
        description=description,
        volume_used_ul=volume_used_ul,
        remaining_volume_ul=remaining_volume_ul,
        purpose=purpose,
        project_name=project_name,
    )


def stage_position_log(
    session: AsyncSession,
    *,
    tube: PrimerTube,
    primer_name: str,
    primer_type: str,
    from_position: str | None,
    to_position: str,
) -> None:
    action = "placed" if from_position is None else "moved"
    title = "分管放置入盒" if action == "placed" else "分管位置移动"
    description = (
        f"放置到 {to_position}"
        if action == "placed"
        else f"从 {from_position} 移动到 {to_position}"
    )
    _stage_log(
        session,
        tube=tube,
        primer_name=primer_name,
        primer_type=primer_type,
        action=action,
        title=title,
        description=description,
        from_position=from_position,
        to_position=to_position,
        remaining_volume_ul=tube.remaining_volume_ul,
    )


def stage_archive_log(
    session: AsyncSession,
    *,
    tube: PrimerTube,
    primer_name: str,
    primer_type: str,
    archive_reason: str | None,
    from_position: str | None,
) -> None:
    description = "分管已归档"
    if archive_reason:
        description += f"，原因：{archive_reason}"
    _stage_log(
        session,
        tube=tube,
        primer_name=primer_name,
        primer_type=primer_type,
        action="archived",
        title="分管归档",
        description=description,
        from_position=from_position,
        archive_reason=archive_reason,
        remaining_volume_ul=tube.remaining_volume_ul,
    )


async def get_current_position_label(
    session: AsyncSession, tube_id: int,
) -> str | None:
    query = (
        select(
            FreezerBox.name,
            FreezerBox.storage_location,
            FreezerBox.storage_temperature,
            BoxPosition.row,
            BoxPosition.col,
        )
        .join(FreezerBox, FreezerBox.id == BoxPosition.box_id)
        .where(BoxPosition.tube_id == tube_id)
    )
    row = (await session.execute(query)).one_or_none()
    if row is None:
        return None
    return _format_position(
        box_name=row.name,
        storage_location=row.storage_location,
        storage_temperature=row.storage_temperature,
        row=row.row,
        col=row.col,
    )


async def get_target_position_label(
    session: AsyncSession, box_id: int, row: int, col: int,
) -> str:
    box = (
        await session.execute(
            select(FreezerBox).where(FreezerBox.id == box_id)
        )
    ).scalar_one_or_none()
    if box is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Box not found")
    return _format_position(
        box_name=box.name,
        storage_location=box.storage_location,
        storage_temperature=box.storage_temperature,
        row=row,
        col=col,
    )


def _stage_log(
    session: AsyncSession,
    *,
    tube: PrimerTube,
    primer_name: str,
    primer_type: str,
    action: str,
    title: str,
    description: str,
    from_position: str | None = None,
    to_position: str | None = None,
    volume_used_ul: float | None = None,
    remaining_volume_ul: float | None = None,
    purpose: str | None = None,
    project_name: str | None = None,
    archive_reason: str | None = None,
) -> None:
    session.add(TubeLifecycleLog(
        tube_id=tube.id,
        primer_id=tube.primer_id,
        primer_name=primer_name,
        primer_type=primer_type,
        batch_number=tube.batch_number,
        tube_number=tube.tube_number,
        action=action,
        title=title,
        description=description,
        from_position=from_position,
        to_position=to_position,
        volume_used_ul=volume_used_ul,
        remaining_volume_ul=remaining_volume_ul,
        purpose=purpose,
        project_name=project_name,
        archive_reason=archive_reason,
    ))


def _resolve_window(
    *,
    preset: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime | None, datetime | None]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="开始日期不能晚于结束日期",
        )
    if start_date or end_date:
        window_start = _as_utc_start(start_date) if start_date else None
        window_end = _as_utc_end(end_date) if end_date else None
        return window_start, window_end

    normalized = _normalize_preset(preset)
    now = datetime.now(timezone.utc)
    if normalized == "24h":
        return now - timedelta(hours=24), now
    if normalized == "7d":
        return now - timedelta(days=7), now
    return now - timedelta(days=30), now


def _normalize_preset(preset: str | None) -> str:
    normalized = preset or DEFAULT_PRESET
    if normalized not in VALID_PRESETS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="仅支持 24h、7d、30d 预设范围",
        )
    return normalized


def _describe_window(
    *,
    preset: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[str, str]:
    if start_date or end_date:
        start_label = start_date.isoformat() if start_date else "起始"
        end_label = end_date.isoformat() if end_date else "至今"
        return f"{start_label} 至 {end_label}", f"{start_label}_to_{end_label}"
    normalized = _normalize_preset(preset)
    if normalized == "24h":
        return "近 24 小时", "24h"
    if normalized == "7d":
        return "近 7 天", "7d"
    return "近 30 天", "30d"


def _render_log_lines(log: TubeLifecycleLog) -> list[str]:
    lines = [
        f"[{_format_timestamp(log.created_at)}] {log.title}",
        f"引探: {log.primer_name} ({'探针' if log.primer_type == 'probe' else '引物'})",
        f"分管: {_tube_label(log.batch_number, log.tube_number)}",
        f"说明: {log.description}",
    ]
    if log.from_position or log.to_position:
        position_line = f"位置: {log.from_position or '-'}"
        if log.to_position:
            position_line += f" -> {log.to_position}"
        lines.append(position_line)
    if log.volume_used_ul is not None:
        lines.append(f"用量: {log.volume_used_ul:.1f} uL")
    if log.remaining_volume_ul is not None:
        lines.append(f"剩余: {log.remaining_volume_ul:.1f} uL")
    if log.project_name:
        lines.append(f"项目: {log.project_name}")
    if log.purpose:
        lines.append(f"用途: {log.purpose}")
    if log.archive_reason:
        lines.append(f"归档原因: {log.archive_reason}")
    lines.extend(["-" * 48, ""])
    return lines


def _tube_label(batch_number: str, tube_number: str | None) -> str:
    return batch_number if not tube_number else f"{batch_number} #{tube_number}"


def _format_position(
    *,
    box_name: str,
    storage_location: str | None,
    storage_temperature: str | None,
    row: int,
    col: int,
) -> str:
    parts = [f"{box_name} {_slot_label(row, col)}"]
    context = " / ".join(filter(None, [storage_location, storage_temperature]))
    if context:
        parts.append(context)
    return " · ".join(parts)


def _slot_label(row: int, col: int) -> str:
    prefix = ROW_LABELS[row] if row < len(ROW_LABELS) else str(row)
    return f"{prefix}{col + 1}"


def _as_utc_start(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def _as_utc_end(value: date) -> datetime:
    return datetime.combine(value + timedelta(days=1), time.min, tzinfo=timezone.utc)


def _format_timestamp(value: datetime) -> str:
    timestamp = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(DISPLAY_TIMEZONE).strftime("%Y-%m-%d %H:%M:%S")
