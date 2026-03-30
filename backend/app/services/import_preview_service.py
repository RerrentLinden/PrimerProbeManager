from collections import Counter
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.primer import Primer
from app.schemas.import_data import ImportPreviewResponse, PrimerPreviewRow, TubePreviewRow
from app.services.import_db_service import (
    PrimerIdentity,
    find_tube,
    load_primers_by_identities,
    suggest_renamed_primer_name,
)
from app.services.import_excel_service import PrimerSheetRow, TubeSheetRow

CONFLICT_STRATEGIES = ["error", "rename", "overwrite", "skip"]
RESOLVABLE_STRATEGIES = ["rename", "overwrite", "skip"]


@dataclass(frozen=True)
class PrimerDecision:
    row: PrimerSheetRow
    identity: PrimerIdentity
    action: str
    message: str | None
    existing: Primer | None
    suggested_name: str | None = None


async def build_preview(
    session: AsyncSession,
    *,
    primer_rows: list[PrimerSheetRow],
    tube_rows: list[TubeSheetRow],
) -> ImportPreviewResponse:
    primer_decisions = await build_primer_decisions(session, primer_rows)
    primer_preview = [to_primer_preview_row(item) for item in primer_decisions]
    tube_preview = await _build_tube_preview_rows(session, tube_rows, primer_decisions)
    return ImportPreviewResponse(
        primers=primer_preview,
        tubes=tube_preview,
        primer_create_count=sum(item.action == "create" for item in primer_preview),
        primer_update_count=sum(item.action == "update" for item in primer_preview),
        primer_conflict_count=sum(item.action == "conflict" for item in primer_preview),
        tube_create_count=sum(item.action == "create" for item in tube_preview),
        tube_update_count=sum(item.action == "update" for item in tube_preview),
        tube_conflict_count=sum(item.action == "conflict" for item in tube_preview),
        error_count=sum(item.action == "error" for item in primer_preview + tube_preview),
        available_conflict_strategies=CONFLICT_STRATEGIES,
    )


async def build_primer_decisions(
    session: AsyncSession,
    rows: list[PrimerSheetRow],
) -> list[PrimerDecision]:
    duplicates = _duplicate_identities(_primer_identity(row) for row in rows)
    existing_map = await load_primers_by_identities(
        session, (_primer_identity(row) for row in rows)
    )
    seen_identities: set[PrimerIdentity] = set()
    decisions: list[PrimerDecision] = []
    for row in rows:
        identity = _primer_identity(row)
        if identity in duplicates and identity in seen_identities:
            suggested = await suggest_renamed_primer_name(
                session, original_name=row.name, mw=row.mw,
            )
            decisions.append(
                PrimerDecision(
                    row=row,
                    identity=identity,
                    action="conflict",
                    message="模板内存在重复的 名称+MW（可跳过或重命名）",
                    existing=existing_map.get(identity),
                    suggested_name=suggested,
                )
            )
            continue
        seen_identities.add(identity)
        existing = existing_map.get(identity)
        if existing is None:
            decisions.append(PrimerDecision(row, identity, "create", "新增", None))
            continue
        if existing.sequence == row.sequence:
            decisions.append(
                PrimerDecision(
                    row, identity, "update", "已存在，将更新字段", existing
                )
            )
            continue
        suggested_name = await suggest_renamed_primer_name(
            session,
            original_name=row.name,
            mw=row.mw,
        )
        decisions.append(
            PrimerDecision(
                row=row,
                identity=identity,
                action="conflict",
                message="同名同 MW 且序列不同",
                existing=existing,
                suggested_name=suggested_name,
            )
        )
    return decisions


def to_primer_preview_row(decision: PrimerDecision) -> PrimerPreviewRow:
    row = decision.row
    return PrimerPreviewRow(
        row_number=row.row_number,
        import_key=row.import_key,
        name=row.name,
        resolved_name=row.name if decision.action != "conflict" else None,
        sequence=row.sequence,
        project_names=list(row.project_names),
        modification_5prime=row.modification_5prime,
        modification_3prime=row.modification_3prime,
        mw=row.mw,
        tm=row.tm,
        action=decision.action,
        message=decision.message,
        conflict_existing_name=decision.existing.name if decision.existing else None,
        conflict_existing_sequence=(
            decision.existing.sequence if decision.existing else None
        ),
        suggested_name=decision.suggested_name,
        available_strategies=(
            RESOLVABLE_STRATEGIES if decision.action == "conflict" else []
        ),
    )


async def _build_tube_preview_rows(
    session: AsyncSession,
    rows: list[TubeSheetRow],
    primer_decisions: list[PrimerDecision],
) -> list[TubePreviewRow]:
    duplicates = _duplicate_tube_keys(rows)
    decision_by_identity: dict[PrimerIdentity, PrimerDecision] = {}
    for item in primer_decisions:
        if item.identity not in decision_by_identity:
            decision_by_identity[item.identity] = item
    db_primers = await load_primers_by_identities(
        session, (_tube_identity(row) for row in rows)
    )
    preview_rows: list[TubePreviewRow] = []
    for row in rows:
        action, message, primer_id = _tube_preview_parent_state(
            row=row,
            duplicate_keys=duplicates,
            decision_by_identity=decision_by_identity,
            db_primers=db_primers,
        )
        if action in {"error", "conflict"}:
            preview_rows.append(_new_tube_preview_row(row, action, message))
            continue
        if primer_id is None:
            preview_rows.append(_new_tube_preview_row(row, "create", "父引探将被新增"))
            continue
        existing = await find_tube(
            session,
            primer_id=primer_id,
            batch_number=row.batch_number,
            tube_number=row.tube_number,
        )
        preview_action = "update" if existing else "create"
        preview_message = "已存在，将更新体积" if existing else "新增"
        preview_rows.append(_new_tube_preview_row(row, preview_action, preview_message))
    return preview_rows


def _tube_preview_parent_state(
    *,
    row: TubeSheetRow,
    duplicate_keys: set[tuple],
    decision_by_identity: dict[PrimerIdentity, PrimerDecision],
    db_primers: dict[PrimerIdentity, Primer],
) -> tuple[str, str, int | None]:
    if _tube_key(row) in duplicate_keys:
        return "error", "模板内存在重复分管(引探名称+MW+批号+分管编号)", None
    identity = _tube_identity(row)
    decision = decision_by_identity.get(identity)
    if decision is not None:
        if decision.action == "error":
            return "error", "父引探在模板内存在错误", None
        if decision.action == "conflict":
            return "conflict", "父引探存在冲突，确认时需选择策略", None
        if decision.existing is None:
            return "create", "父引探将被新增", None
        return "update", "父引探已存在", decision.existing.id
    db_primer = db_primers.get(identity)
    if db_primer is None:
        return (
            "error",
            "找不到对应父引探(按 名称+MW；需已存在于库中或在本次模板的引探信息 sheet 中提供)",
            None,
        )
    return "update", "父引探已存在", db_primer.id


def _new_tube_preview_row(
    row: TubeSheetRow, action: str, message: str
) -> TubePreviewRow:
    return TubePreviewRow(
        row_number=row.row_number,
        import_key=row.import_key,
        primer_name=row.primer_name,
        primer_mw=row.primer_mw,
        batch_number=row.batch_number,
        tube_number=row.tube_number,
        dissolution_date=str(row.dissolution_date) if row.dissolution_date else None,
        initial_volume_ul=row.initial_volume_ul,
        action=action,
        message=message,
    )


def primer_identity(row: PrimerSheetRow) -> PrimerIdentity:
    return _primer_identity(row)


def tube_identity(row: TubeSheetRow) -> PrimerIdentity:
    return _tube_identity(row)


def tube_key(row: TubeSheetRow) -> tuple[str, float | None, str, str | None]:
    return _tube_key(row)


def duplicate_tube_keys(rows: list[TubeSheetRow]) -> set[tuple]:
    return _duplicate_tube_keys(rows)


def _primer_identity(row: PrimerSheetRow) -> PrimerIdentity:
    return row.name, row.mw


def _tube_identity(row: TubeSheetRow) -> PrimerIdentity:
    return row.primer_name, row.primer_mw


def _tube_key(row: TubeSheetRow) -> tuple[str, float | None, str, str | None]:
    return row.primer_name, row.primer_mw, row.batch_number, row.tube_number


def _duplicate_identities(identities) -> set[PrimerIdentity]:
    counter = Counter(identities)
    return {key for key, count in counter.items() if count > 1}


def _duplicate_tube_keys(rows: list[TubeSheetRow]) -> set[tuple]:
    counter = Counter(_tube_key(row) for row in rows)
    return {key for key, count in counter.items() if count > 1}
