import type {
  ImportPreview,
  PrimerConflictResolution,
  PrimerConflictStrategy,
  PrimerImportPreviewRow,
  TubeImportPreviewRow,
} from '@/types'

interface Props {
  readonly preview: ImportPreview
  readonly resolutions: Record<string, PrimerConflictResolution>
  readonly onResolutionChange: (
    importKey: string,
    strategy: PrimerConflictStrategy,
    renamedName: string,
  ) => void
}

const TABLE_HEAD_CLASS = 'border-b border-lab-border text-left text-lab-muted'
const CELL_CLASS = 'px-2 py-2 align-top'

export default function PreviewTable({
  preview,
  resolutions,
  onResolutionChange,
}: Props) {
  return (
    <div className="space-y-4">
      <SummaryRow preview={preview} />
      <PrimerTable
        rows={preview.primers}
        resolutions={resolutions}
        onResolutionChange={onResolutionChange}
      />
      <TubeTable rows={preview.tubes} />
    </div>
  )
}

function SummaryRow({ preview }: { readonly preview: ImportPreview }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
      <SummaryItem label="引探新增" value={preview.primer_create_count} tone="text-lab-success" />
      <SummaryItem label="引探更新" value={preview.primer_update_count} tone="text-lab-warning" />
      <SummaryItem label="引探冲突" value={preview.primer_conflict_count} tone="text-lab-probe" />
      <SummaryItem label="分管新增" value={preview.tube_create_count} tone="text-lab-success" />
      <SummaryItem label="分管更新" value={preview.tube_update_count} tone="text-lab-warning" />
      <SummaryItem label="分管冲突" value={preview.tube_conflict_count} tone="text-lab-probe" />
      <SummaryItem label="分管放置" value={preview.tube_placement_count} tone="text-lab-primary" />
      <SummaryItem label="错误行数" value={preview.error_count} tone="text-lab-danger" />
    </div>
  )
}

function SummaryItem({ label, value, tone }: {
  readonly label: string
  readonly value: number
  readonly tone: string
}) {
  return (
    <div className="rounded-lg border border-lab-border bg-lab-surface px-3 py-2">
      <p className="text-[11px] text-lab-muted">{label}</p>
      <p className={`text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function PrimerTable({
  rows,
  resolutions,
  onResolutionChange,
}: {
  readonly rows: PrimerImportPreviewRow[]
  readonly resolutions: Record<string, PrimerConflictResolution>
  readonly onResolutionChange: Props['onResolutionChange']
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-lab-muted">引探预览</h3>
      <div className="overflow-x-auto rounded-lg border border-lab-border">
        <table className="min-w-full text-xs">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={CELL_CLASS}>行号</th>
              <th className={CELL_CLASS}>名称</th>
              <th className={CELL_CLASS}>MW</th>
              <th className={CELL_CLASS}>序列</th>
              <th className={CELL_CLASS}>项目</th>
              <th className={CELL_CLASS}>动作</th>
              <th className={CELL_CLASS}>说明</th>
              <th className={CELL_CLASS}>冲突处理</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PrimerRow
                key={`${row.import_key}-${row.row_number}`}
                row={row}
                resolution={resolutions[row.import_key]}
                onResolutionChange={onResolutionChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PrimerRow({
  row,
  resolution,
  onResolutionChange,
}: {
  readonly row: PrimerImportPreviewRow
  readonly resolution: PrimerConflictResolution | undefined
  readonly onResolutionChange: Props['onResolutionChange']
}) {
  return (
    <tr className="border-b border-lab-border last:border-0">
      <td className={CELL_CLASS}>{row.row_number}</td>
      <td className={`${CELL_CLASS} font-medium text-lab-text`}>{row.name}</td>
      <td className={CELL_CLASS}>{row.mw ?? '-'}</td>
      <td className={`${CELL_CLASS} max-w-[280px] truncate font-sequence`} title={row.sequence}>
        {row.sequence}
      </td>
      <td className={CELL_CLASS}>{row.project_names.length > 0 ? row.project_names.join(', ') : '-'}</td>
      <td className={CELL_CLASS}>{actionLabel(row.action)}</td>
      <td className={`${CELL_CLASS} min-w-[220px] text-lab-muted`}>
        <p>{row.message ?? '-'}</p>
        {row.conflict_existing_name && (
          <p className="mt-1 text-[11px] text-lab-faint">
            已有记录: {row.conflict_existing_name}
            {row.conflict_existing_sequence ? ` / ${row.conflict_existing_sequence}` : ''}
          </p>
        )}
      </td>
      <td className={`${CELL_CLASS} min-w-[260px]`}>
        {row.action === 'conflict' ? (
          <ResolutionEditor
            row={row}
            resolution={resolution}
            onResolutionChange={onResolutionChange}
          />
        ) : (
          <span className="text-lab-faint">-</span>
        )}
      </td>
    </tr>
  )
}

function ResolutionEditor({
  row,
  resolution,
  onResolutionChange,
}: {
  readonly row: PrimerImportPreviewRow
  readonly resolution: PrimerConflictResolution | undefined
  readonly onResolutionChange: Props['onResolutionChange']
}) {
  const currentStrategy = resolution?.strategy ?? pickFallbackStrategy(row)
  const currentName = resolution?.renamed_name ?? row.suggested_name ?? `${row.name}_导入1`

  return (
    <div className="space-y-2">
      <select
        className="input-field"
        value={currentStrategy}
        onChange={(event) => onResolutionChange(
          row.import_key,
          event.target.value as PrimerConflictStrategy,
          currentName,
        )}
      >
        {row.available_strategies.map((strategy) => (
          <option key={strategy} value={strategy}>
            {strategyLabel(strategy)}
          </option>
        ))}
      </select>
      {currentStrategy === 'rename' && (
        <input
          type="text"
          className="input-field"
          value={currentName}
          onChange={(event) => onResolutionChange(row.import_key, 'rename', event.target.value)}
          placeholder="输入重命名后的引探名称"
        />
      )}
    </div>
  )
}

function TubeTable({ rows }: { readonly rows: TubeImportPreviewRow[] }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-lab-muted">分管预览</h3>
      <div className="overflow-x-auto rounded-lg border border-lab-border">
        <table className="min-w-full text-xs">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={CELL_CLASS}>行号</th>
              <th className={CELL_CLASS}>父引探</th>
              <th className={CELL_CLASS}>父引探 MW</th>
              <th className={CELL_CLASS}>批号</th>
              <th className={CELL_CLASS}>分管编号</th>
              <th className={CELL_CLASS}>定容日期</th>
              <th className={CELL_CLASS}>初始体积(uL)</th>
              <th className={CELL_CLASS}>冻存盒</th>
              <th className={CELL_CLASS}>动作</th>
              <th className={CELL_CLASS}>说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.import_key}-${row.row_number}`} className="border-b border-lab-border last:border-0">
                <td className={CELL_CLASS}>{row.row_number}</td>
                <td className={CELL_CLASS}>{row.primer_name}</td>
                <td className={CELL_CLASS}>{row.primer_mw ?? '-'}</td>
                <td className={CELL_CLASS}>{row.batch_number}</td>
                <td className={CELL_CLASS}>{row.tube_number ?? '-'}</td>
                <td className={CELL_CLASS}>{row.dissolution_date ?? '-'}</td>
                <td className={CELL_CLASS}>{row.initial_volume_ul}</td>
                <td className={CELL_CLASS}>
                  {row.box_name ? (
                    <span title={row.placement_message ?? ''}>{row.box_name} {row.well_position}</span>
                  ) : '-'}
                  {row.placement_message && !row.placement_message.startsWith('将放入') && (
                    <p className="mt-0.5 text-[11px] text-lab-danger">{row.placement_message}</p>
                  )}
                </td>
                <td className={CELL_CLASS}>{actionLabel(row.action)}</td>
                <td className={`${CELL_CLASS} text-lab-muted`}>{row.message ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function actionLabel(action: string): string {
  if (action === 'create') return '新增'
  if (action === 'update') return '更新'
  if (action === 'skip') return '跳过'
  if (action === 'error') return '错误'
  if (action === 'conflict') return '冲突'
  return action
}

function strategyLabel(strategy: PrimerConflictStrategy): string {
  if (strategy === 'rename') return '重命名导入'
  if (strategy === 'overwrite') return '覆盖已有引探'
  return '跳过该引探'
}

function pickFallbackStrategy(row: PrimerImportPreviewRow): PrimerConflictStrategy {
  if (row.available_strategies.includes('rename')) return 'rename'
  return row.available_strategies[0] ?? 'skip'
}
