import type { GridSlot } from '@/types'

interface Props {
  readonly slot: GridSlot
  readonly position: { x: number; y: number }
  readonly onAction: (action: string) => void
  readonly onClose: () => void
}

const MENU_ITEMS = [
  { action: 'detail', label: '查看详情', icon: '🔍' },
  { action: 'move', label: '移动', icon: '↗️' },
  { action: 'archive', label: '归档', icon: '📦' },
] as const

export default function SlotContextMenu({ slot, onAction, onClose }: Props) {
  if (!slot.tube) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[160px]"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="text-sm font-medium">{slot.tube.primer_name}</p>
          <p className="text-xs text-slate-500">
            {slot.tube.batch_number} | {slot.tube.remaining_volume_ul} uL
          </p>
        </div>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.action}
            type="button"
            onClick={() => onAction(item.action)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
