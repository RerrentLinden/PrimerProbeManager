import type { Stats } from '@/types'

interface Props {
  readonly stats: Stats | null
  readonly onAlertClick: () => void
}

const CARDS = [
  { key: 'primer_count', label: '引物总数', color: 'border-lab-border bg-lab-surface', textColor: 'text-lab-accent', icon: '🧬', iconGlow: 'drop-shadow-[0_0_6px_rgba(74,158,255,0.5)]' },
  { key: 'probe_count', label: '探针总数', color: 'border-lab-border bg-lab-surface', textColor: 'text-lab-probe', icon: '🔬', iconGlow: 'drop-shadow-[0_0_6px_rgba(255,138,61,0.5)]' },
  { key: 'active_tube_count', label: '活跃管数', color: 'border-lab-border bg-lab-surface', textColor: 'text-lab-success', icon: '🧪', iconGlow: 'drop-shadow-[0_0_6px_rgba(61,214,140,0.5)]' },
  { key: 'low_volume_count', label: '低体积报警', color: 'border-lab-border bg-lab-surface', textColor: 'text-lab-danger', icon: '⚠️', iconGlow: 'drop-shadow-[0_0_6px_rgba(255,71,87,0.5)]' },
] as const

export default function StatCards({ stats, onAlertClick }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((card) => {
        const value = stats ? stats[card.key as keyof Stats] : 0
        const isAlert = card.key === 'low_volume_count'
        return (
          <button
            key={card.key}
            type="button"
            onClick={isAlert ? onAlertClick : undefined}
            className={`stat-card ${card.color} text-left ${isAlert && value > 0 ? 'animate-pulse-ring cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-lab-muted">{card.label}</span>
              <span className={`text-lg ${card.iconGlow}`}>{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{value}</p>
          </button>
        )
      })}
    </div>
  )
}
