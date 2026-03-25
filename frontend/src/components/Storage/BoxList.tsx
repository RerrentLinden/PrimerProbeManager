import type { FreezerBox } from '@/types'

interface Props {
  readonly boxes: FreezerBox[]
  readonly selectedId: number | null
  readonly onSelect: (id: number) => void
  readonly onCreateBox: () => void
}

export default function BoxList({ boxes, selectedId, onSelect, onCreateBox }: Props) {
  return (
    <div className="space-y-3">
      <button type="button" className="btn-primary w-full text-sm" onClick={onCreateBox}>
        新冻存盒
      </button>

      {boxes.map((box) => (
        <BoxCard
          key={box.id}
          box={box}
          isSelected={box.id === selectedId}
          onSelect={() => onSelect(box.id)}
        />
      ))}
    </div>
  )
}

function BoxCard({ box, isSelected, onSelect }: {
  readonly box: FreezerBox
  readonly isSelected: boolean
  readonly onSelect: () => void
}) {
  const capacity = box.rows * box.cols
  const occupied = box.occupied_count ?? 0
  const pct = capacity > 0 ? (occupied / capacity) * 100 : 0

  return (
    <button
      type="button"
      data-box-id={box.id}
      onClick={onSelect}
      className={`card p-3 w-full text-left transition-all ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'hover:border-slate-300'
      }`}
    >
      <div className="font-medium text-sm">{box.name}</div>
      <div className="text-xs text-slate-500 mt-0.5">
        {box.storage_location ?? '-'} {box.storage_temperature ?? ''}
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>占用率</span>
          <span className="tabular-nums">{occupied}/{capacity}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}
