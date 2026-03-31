from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.box_position import BoxPosition
from app.models.freezer_box import FreezerBox
from app.models.primer import Primer
from app.models.primer_tube import PrimerTube
from app.schemas.import_data import (
    ImportConfirmOptions,
    ImportConfirmResponse,
    PrimerConflictResolution,
)
from app.services import tube_lifecycle_log_service
from app.services.import_db_service import (
    PrimerIdentity,
    ensure_primer_identity_available,
    find_tube,
    load_primers_by_identities,
)
from app.services.import_excel_service import PrimerSheetRow, TubeSheetRow, parse_well_position
from app.services.import_project_service import attach_projects_to_primer
from app.services.import_preview_service import (
    PrimerDecision,
    build_primer_decisions,
    duplicate_tube_keys,
    tube_identity,
    tube_key,
)
from app.services.primer_metrics import calculate_gc_percent, count_bases

CONFLICT_STRATEGIES = {"error", "rename", "overwrite", "skip"}


async def apply_confirm(
    session: AsyncSession,
    *,
    primer_rows: list[PrimerSheetRow],
    tube_rows: list[TubeSheetRow],
    options: ImportConfirmOptions,
) -> ImportConfirmResponse:
    primer_decisions = await build_primer_decisions(session, primer_rows)
    resolution_map = {
        item.import_key: item for item in options.primer_conflict_resolutions
    }
    identity_map: dict[PrimerIdentity, Primer | None] = {}
    stats = _empty_stats()
    for decision in primer_decisions:
        await _apply_primer_decision(
            session,
            decision=decision,
            default_strategy=options.default_conflict_strategy,
            resolution_map=resolution_map,
            identity_map=identity_map,
            stats=stats,
        )
    await _apply_tube_rows(session, rows=tube_rows, identity_map=identity_map, stats=stats)
    return ImportConfirmResponse(
        conflict_strategy=options.default_conflict_strategy,
        primers_created=stats["primers_created"],
        primers_updated=stats["primers_updated"],
        primers_renamed=stats["primers_renamed"],
        primers_skipped=stats["primers_skipped"],
        tubes_created=stats["tubes_created"],
        tubes_updated=stats["tubes_updated"],
        tubes_skipped=stats["tubes_skipped"],
        tubes_placed=stats["tubes_placed"],
    )


def _empty_stats() -> dict[str, int]:
    return {
        "primers_created": 0,
        "primers_updated": 0,
        "primers_renamed": 0,
        "primers_skipped": 0,
        "tubes_created": 0,
        "tubes_updated": 0,
        "tubes_skipped": 0,
        "tubes_placed": 0,
    }


async def _apply_primer_decision(
    session: AsyncSession,
    *,
    decision: PrimerDecision,
    default_strategy: str,
    resolution_map: dict[str, PrimerConflictResolution],
    identity_map: dict[PrimerIdentity, Primer | None],
    stats: dict[str, int],
) -> None:
    row = decision.row
    if decision.action == "error":
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"引探行 {row.row_number}: {decision.message}")
    if decision.action == "create":
        primer = Primer(**_build_primer_payload(row, row.name))
        session.add(primer)
        await session.flush()
        await attach_projects_to_primer(
            session,
            primer_id=primer.id,
            project_names=row.project_names,
        )
        identity_map[decision.identity] = primer
        stats["primers_created"] += 1
        return
    if decision.action == "update":
        _apply_primer_fields(decision.existing, row, update_sequence=False)
        await attach_projects_to_primer(
            session,
            primer_id=decision.existing.id,
            project_names=row.project_names,
        )
        identity_map[decision.identity] = decision.existing
        stats["primers_updated"] += 1
        return
    strategy, renamed_name = _resolve_strategy(
        decision=decision,
        default_strategy=default_strategy,
        resolution_map=resolution_map,
    )
    if strategy == "error":
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"引探冲突行 {row.row_number} 未解决")
    if strategy == "skip":
        identity_map[decision.identity] = None
        stats["primers_skipped"] += 1
        return
    if strategy == "overwrite":
        _apply_primer_fields(decision.existing, row, update_sequence=True)
        await attach_projects_to_primer(
            session,
            primer_id=decision.existing.id,
            project_names=row.project_names,
        )
        identity_map[decision.identity] = decision.existing
        stats["primers_updated"] += 1
        return
    if renamed_name is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"引探冲突行 {row.row_number} 缺少重命名名称")
    try:
        await ensure_primer_identity_available(session, name=renamed_name, mw=row.mw)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    primer = Primer(**_build_primer_payload(row, renamed_name))
    session.add(primer)
    await session.flush()
    await attach_projects_to_primer(
        session,
        primer_id=primer.id,
        project_names=row.project_names,
    )
    identity_map[decision.identity] = primer
    stats["primers_created"] += 1
    stats["primers_renamed"] += 1


def _resolve_strategy(
    *,
    decision: PrimerDecision,
    default_strategy: str,
    resolution_map: dict[str, PrimerConflictResolution],
) -> tuple[str, str | None]:
    resolution = resolution_map.get(decision.row.import_key)
    strategy = default_strategy if resolution is None else resolution.strategy
    if strategy not in CONFLICT_STRATEGIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"不支持的冲突策略: {strategy}")
    renamed_name = decision.suggested_name
    if resolution is not None and resolution.renamed_name:
        renamed_name = resolution.renamed_name.strip()
    return strategy, renamed_name


async def _apply_tube_rows(
    session: AsyncSession,
    *,
    rows: list[TubeSheetRow],
    identity_map: dict[PrimerIdentity, Primer | None],
    stats: dict[str, int],
) -> None:
    duplicates = duplicate_tube_keys(rows)
    db_primers = await load_primers_by_identities(session, (tube_identity(row) for row in rows))
    box_names = {row.box_name for row in rows if row.box_name}
    box_map = await _load_boxes_by_names(session, box_names) if box_names else {}
    for row in rows:
        if tube_key(row) in duplicates:
            raise HTTPException(status.HTTP_409_CONFLICT, detail=f"分管行 {row.row_number} 在模板内重复")
        identity = tube_identity(row)
        parent = identity_map.get(identity) if identity in identity_map else db_primers.get(identity)
        if identity in identity_map and parent is None:
            stats["tubes_skipped"] += 1
            continue
        if parent is None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    f"分管行 {row.row_number} 找不到父引探；"
                    "分管只会绑定库中已有引探或同一模板里同时导入的引探"
                ),
            )
        existing = await find_tube(
            session,
            primer_id=parent.id,
            batch_number=row.batch_number,
            tube_number=row.tube_number,
        )
        if existing is None:
            tube = _new_tube(parent.id, row)
            session.add(tube)
            await session.flush()
            tube_lifecycle_log_service.stage_created_log(
                session,
                tube=tube,
                primer_name=parent.name,
                primer_type=parent.type,
            )
            stats["tubes_created"] += 1
            placed = await _place_tube(session, tube.id, row, box_map)
            if placed:
                stats["tubes_placed"] += 1
            continue
        _update_tube(existing, row)
        stats["tubes_updated"] += 1
        if not await _tube_has_position(session, existing.id):
            placed = await _place_tube(session, existing.id, row, box_map)
            if placed:
                stats["tubes_placed"] += 1


def _new_tube(primer_id: int, row: TubeSheetRow) -> PrimerTube:
    return PrimerTube(
        primer_id=primer_id,
        batch_number=row.batch_number,
        tube_number=row.tube_number,
        dissolution_date=row.dissolution_date,
        initial_volume_ul=row.initial_volume_ul,
        remaining_volume_ul=row.initial_volume_ul,
    )


def _update_tube(tube: PrimerTube, row: TubeSheetRow) -> None:
    tube.dissolution_date = row.dissolution_date
    tube.initial_volume_ul = row.initial_volume_ul
    tube.remaining_volume_ul = row.initial_volume_ul


def _apply_primer_fields(
    primer: Primer, row: PrimerSheetRow, *, update_sequence: bool
) -> None:
    if update_sequence:
        primer.sequence = row.sequence
    primer.modification_5prime = row.modification_5prime
    primer.modification_3prime = row.modification_3prime
    primer.mw = row.mw
    primer.ug_per_od = row.ug_per_od
    primer.nmol_per_od = row.nmol_per_od
    primer.tm = row.tm
    primer.purification_method = row.purification_method
    primer.base_count = count_bases(primer.sequence)
    primer.gc_percent = calculate_gc_percent(primer.sequence)


def _build_primer_payload(row: PrimerSheetRow, name: str) -> dict:
    return {
        "name": name,
        "sequence": row.sequence,
        "modification_5prime": row.modification_5prime,
        "modification_3prime": row.modification_3prime,
        "mw": row.mw,
        "ug_per_od": row.ug_per_od,
        "nmol_per_od": row.nmol_per_od,
        "gc_percent": calculate_gc_percent(row.sequence),
        "tm": row.tm,
        "purification_method": row.purification_method,
        "base_count": count_bases(row.sequence),
    }


async def _load_boxes_by_names(
    session: AsyncSession, names: set[str],
) -> dict[str, FreezerBox]:
    if not names:
        return {}
    query = select(FreezerBox).where(FreezerBox.name.in_(names))
    boxes = (await session.execute(query)).scalars().all()
    return {box.name: box for box in boxes}


async def _place_tube(
    session: AsyncSession,
    tube_id: int,
    row: TubeSheetRow,
    box_map: dict[str, FreezerBox],
) -> bool:
    if not row.box_name or not row.well_position:
        return False
    box = box_map.get(row.box_name)
    if box is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"分管行 {row.row_number}: 冻存盒「{row.box_name}」不存在",
        )
    parsed_row, parsed_col = parse_well_position(row.well_position)
    if parsed_row < 0 or parsed_row >= box.rows or parsed_col < 0 or parsed_col >= box.cols:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"分管行 {row.row_number}: {row.well_position} 超出冻存盒范围",
        )
    occupied = (
        await session.execute(
            select(BoxPosition.id).where(
                BoxPosition.box_id == box.id,
                BoxPosition.row == parsed_row,
                BoxPosition.col == parsed_col,
            )
        )
    ).scalar_one_or_none()
    if occupied is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"分管行 {row.row_number}: {row.box_name} {row.well_position} 已被占用",
        )
    session.add(BoxPosition(
        box_id=box.id, row=parsed_row, col=parsed_col, tube_id=tube_id,
    ))
    await session.flush()
    return True


async def _tube_has_position(session: AsyncSession, tube_id: int) -> bool:
    query = select(BoxPosition.id).where(BoxPosition.tube_id == tube_id)
    return (await session.execute(query)).scalar_one_or_none() is not None
