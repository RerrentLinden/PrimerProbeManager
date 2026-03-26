import { Link } from 'react-router-dom'
import type { ProjectPrimer } from '@/types'
import { formatGcPercent, truncateSequence } from '@/utils/format'

interface SharedProps {
  readonly removingId: number | null
  readonly savingId: number | null
  readonly drafts: Record<number, string>
  readonly errors: Record<number, string>
  readonly onRemove: (primerId: number) => void
  readonly onDraftChange: (primerId: number, value: string) => void
  readonly onCommitThreshold: (primer: ProjectPrimer) => void
}

interface TableProps extends SharedProps {
  readonly primers: ProjectPrimer[]
}

export function DesktopPrimerTable({ primers, ...props }: TableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-lab-border text-left text-xs font-medium text-lab-muted uppercase tracking-wider">
            <th className="pb-3 pr-3" style={{ width: '12%' }}>名称</th>
            <th className="pb-3 pr-3" style={{ width: '20%' }}>序列</th>
            <th className="pb-3 pr-3" style={{ width: '12%' }}>修饰</th>
            <th className="pb-3 pr-3" style={{ width: '6%' }}>类型</th>
            <th className="pb-3 pr-3" style={{ width: '8%' }}>MW</th>
            <th className="pb-3 pr-3" style={{ width: '6%' }}>Tm</th>
            <th className="pb-3 pr-3" style={{ width: '7%' }}>GC%</th>
            <th className="pb-3 pr-3" style={{ width: '7%' }}>管数</th>
            <th className="pb-3 pr-3" style={{ width: '10%' }}>剩余总量</th>
            <th className="pb-3 pr-3" style={{ width: '18%' }}>告警阈值</th>
            <th className="pb-3" style={{ width: '4%' }}>操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lab-border">
          {primers.map((primer) => (
            <DesktopRow key={primer.id} primer={primer} {...props} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MobilePrimerCards({ primers, ...props }: TableProps) {
  return (
    <div className="md:hidden space-y-3">
      {primers.map((primer) => (
        <MobileCard key={primer.id} primer={primer} {...props} />
      ))}
    </div>
  )
}

function DesktopRow({ primer, ...props }: SharedProps & { readonly primer: ProjectPrimer }) {
  const alerting = isAlerting(primer)
  return (
    <tr className={alerting ? 'bg-lab-danger/5' : 'hover:bg-lab-highlight/50 transition-colors'}>
      <td className="py-3 pr-3">
        <NameCell primer={primer} alerting={alerting} />
      </td>
      <td className="py-3 pr-3">
        <SequenceLink primerId={primer.id} sequence={primer.sequence} />
      </td>
      <td className="py-3 pr-3 text-xs text-lab-muted truncate" title={formatModifications(primer)}>
        {formatModifications(primer) || '-'}
      </td>
      <td className="py-3 pr-3">
        <TypeBadge type={primer.type} />
      </td>
      <td className="py-3 pr-3 tabular-nums text-lab-muted">{primer.mw?.toFixed(1) ?? '-'}</td>
      <td className="py-3 pr-3 tabular-nums text-lab-muted">{primer.tm?.toFixed(1) ?? '-'}</td>
      <td className="py-3 pr-3 tabular-nums text-lab-muted">{formatGcPercent(primer.gc_percent)}</td>
      <td className="py-3 pr-3 tabular-nums">{primer.active_tube_count}</td>
      <td className={`py-3 pr-3 tabular-nums font-medium ${alerting ? 'text-lab-danger' : 'text-lab-text'}`}>
        {formatVolume(primer.total_remaining_volume_ul)}
      </td>
      <td className="py-3 pr-3">
        <ThresholdEditor primer={primer} {...props} />
      </td>
      <td className="py-3">
        <RemoveAction primerId={primer.id} removing={props.removingId === primer.id} onRemove={props.onRemove} />
      </td>
    </tr>
  )
}

function MobileCard({ primer, ...props }: SharedProps & { readonly primer: ProjectPrimer }) {
  const alerting = isAlerting(primer)
  const cardClass = alerting ? 'card p-4 border-lab-danger/30 bg-lab-danger/5' : 'card p-4'
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <NameCell primer={primer} alerting={alerting} compact />
        <button
          type="button"
          className="text-xs text-lab-muted hover:text-lab-danger"
          disabled={props.removingId === primer.id}
          onClick={() => props.onRemove(primer.id)}
        >
          {props.removingId === primer.id ? '移除中...' : '移除'}
        </button>
      </div>

      <SequenceLink primerId={primer.id} sequence={truncateSequence(primer.sequence)} mobile />

      <div className="grid grid-cols-2 gap-2 text-xs text-lab-muted">
        <span>修饰: {formatModifications(primer) || '-'}</span>
        <span>Tm: {primer.tm?.toFixed(1) ?? '-'}</span>
        <span>GC: {formatGcPercent(primer.gc_percent)}</span>
        <span>管数: {primer.active_tube_count}</span>
      </div>

      <div className="mt-3 rounded-lg border border-lab-border bg-lab-surface px-3 py-2">
        <p className="text-xs text-lab-muted">剩余总量</p>
        <p className={`mt-1 text-sm font-semibold ${alerting ? 'text-lab-danger' : 'text-lab-text'}`}>
          {formatVolume(primer.total_remaining_volume_ul)}
        </p>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-lab-muted mb-1">告警阈值</label>
        <div className="max-w-[180px]">
          <ThresholdEditor primer={primer} {...props} />
        </div>
      </div>
    </div>
  )
}

function NameCell({
  primer,
  alerting,
  compact,
}: {
  readonly primer: ProjectPrimer
  readonly alerting: boolean
  readonly compact?: boolean
}) {
  return (
    <div className="min-w-0">
      <Link
        to={`/primers/${primer.id}`}
        className={compact ? 'font-medium text-lab-text truncate block' : 'font-medium text-lab-accent hover:text-lab-accent/80 truncate block'}
      >
        {primer.name}
      </Link>
      <div className="mt-1 flex items-center gap-2">
        {compact && <TypeBadge type={primer.type} />}
        {alerting && <span className="text-xs font-medium text-lab-danger">低量预警</span>}
      </div>
    </div>
  )
}

function RemoveAction({
  primerId,
  removing,
  onRemove,
}: {
  readonly primerId: number
  readonly removing: boolean
  readonly onRemove: (primerId: number) => void
}) {
  return (
    <button
      type="button"
      className="text-lab-faint hover:text-lab-danger"
      disabled={removing}
      onClick={() => onRemove(primerId)}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

function ThresholdEditor({ primer, ...props }: SharedProps & { readonly primer: ProjectPrimer }) {
  const error = props.errors[primer.id] ?? ''
  const saving = props.savingId === primer.id
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.drafts[primer.id] ?? ''}
          onChange={(e) => props.onDraftChange(primer.id, e.target.value)}
          onBlur={() => props.onCommitThreshold(primer)}
          onKeyDown={(e) => handleThresholdKeyDown(e, primer, props.onCommitThreshold)}
          disabled={saving}
          className="input-field py-1.5 text-xs"
        />
        <span className="text-xs text-lab-muted shrink-0">uL</span>
      </div>
      {error && <p className="text-xs text-lab-danger">{error}</p>}
    </div>
  )
}

function SequenceLink({
  primerId,
  sequence,
  mobile,
}: {
  readonly primerId: number
  readonly sequence: string
  readonly mobile?: boolean
}) {
  const className = mobile
    ? 'font-sequence text-xs text-lab-muted mt-3 mb-3 truncate block hover:text-lab-accent'
    : 'font-sequence text-xs text-lab-muted hover:text-lab-accent block truncate'
  return (
    <Link to={`/primers/${primerId}`} className={className}>
      {sequence}
    </Link>
  )
}

function TypeBadge({ type }: { readonly type: ProjectPrimer['type'] }) {
  return (
    <span className={type === 'probe' ? 'badge-probe' : 'badge-primer'}>
      {type === 'probe' ? '探针' : '引物'}
    </span>
  )
}

function formatModifications(primer: ProjectPrimer): string {
  const parts: string[] = []
  if (primer.modification_5prime) parts.push(`5'${primer.modification_5prime}`)
  if (primer.modification_3prime) parts.push(`3'${primer.modification_3prime}`)
  return parts.join(' / ')
}

function formatVolume(volume: number): string {
  return `${volume.toFixed(1)} uL`
}

function isAlerting(primer: ProjectPrimer): boolean {
  const threshold = primer.low_volume_alert_threshold_ul
  return threshold !== null && threshold !== undefined && threshold > 0 && primer.total_remaining_volume_ul <= threshold
}

function handleThresholdKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  _primer: ProjectPrimer,
  _onCommitThreshold: (primer: ProjectPrimer) => void,
) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  event.currentTarget.blur()
}
