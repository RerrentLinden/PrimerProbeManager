import { volumePercent, isLowVolume } from '@/utils/format'

interface Props {
  readonly remaining: number
  readonly initial: number
  readonly showLabel?: boolean
}

export default function VolumeBar({ remaining, initial, showLabel = true }: Props) {
  const pct = volumePercent(remaining, initial)
  const low = isLowVolume(remaining, initial)

  const bgColor = low
    ? 'bg-red-500'
    : pct > 50
      ? 'bg-emerald-500'
      : pct > 20
        ? 'bg-yellow-500'
        : 'bg-orange-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${bgColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium tabular-nums ${low ? 'text-red-600' : 'text-slate-500'}`}>
          {remaining.toFixed(1)} uL
        </span>
      )}
    </div>
  )
}
