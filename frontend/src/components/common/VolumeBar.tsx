import { volumePercent, isLowVolume } from '@/utils/format'

interface Props {
  readonly remaining: number
  readonly initial: number
  readonly showLabel?: boolean
}

export default function VolumeBar({ remaining, initial, showLabel = true }: Props) {
  const pct = volumePercent(remaining, initial)
  const low = isLowVolume(remaining, initial)

  const barGradient = low
    ? 'bg-gradient-to-r from-lab-danger to-red-400'
    : pct > 50
      ? 'bg-gradient-to-r from-lab-success to-emerald-400'
      : pct > 20
        ? 'bg-gradient-to-r from-lab-warning to-yellow-300'
        : 'bg-gradient-to-r from-lab-probe to-orange-400'

  const barGlow = low
    ? 'shadow-glow-red'
    : pct > 50
      ? 'shadow-glow-green'
      : ''

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[var(--chassis)] rounded-full overflow-hidden shadow-recess">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barGradient} ${barGlow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium tabular-nums ${low ? 'text-lab-danger' : 'text-lab-muted'}`}>
          {remaining.toFixed(1)} uL
        </span>
      )}
    </div>
  )
}
