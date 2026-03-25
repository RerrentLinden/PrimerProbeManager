import type { Stats } from '@/types'

interface Props {
  readonly stats: Stats | null
  readonly onAlertClick: () => void
}

const CARDS = [
  { key: 'primer_count', label: '引物总数', color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-700', icon: '🧬' },
  { key: 'probe_count', label: '探针总数', color: 'border-orange-200 bg-orange-50', textColor: 'text-orange-700', icon: '🔬' },
  { key: 'active_tube_count', label: '活跃管数', color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-700', icon: '🧪' },
  { key: 'low_volume_count', label: '低体积报警', color: 'border-red-200 bg-red-50', textColor: 'text-red-700', icon: '⚠️' },
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
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{value}</p>
          </button>
        )
      })}
    </div>
  )
}
