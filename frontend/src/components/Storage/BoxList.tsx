import type { FreezerBox } from '@/types'
import type { DragReorderResult } from '@/hooks/useDragReorder'
import SortOrderBadge from '@/components/common/SortOrderBadge'
import { moveBoxSortOrder } from '@/api/boxes'

interface Props {
  readonly boxes: FreezerBox[]
  readonly selectedId: number | null
  readonly onSelect: (id: number) => void
  readonly onCreateBox: () => void
  readonly reorder?: DragReorderResult<FreezerBox>
  readonly onRefresh?: () => void
}

export default function BoxList({ boxes, selectedId, onSelect, onCreateBox, reorder, onRefresh }: Props) {
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
          reorder={reorder}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}

function BoxCard({ box, isSelected, onSelect, reorder, onRefresh }: {
  readonly box: FreezerBox
  readonly isSelected: boolean
  readonly onSelect: () => void
  readonly reorder?: DragReorderResult<FreezerBox>
  readonly onRefresh?: () => void
}) {
  const capacity = box.rows * box.cols
  const occupied = box.occupied_count ?? 0
  const pct = capacity > 0 ? (occupied / capacity) * 100 : 0
  const isDragging = reorder?.isDragSource(box.id) ?? false
  const insertion = reorder?.insertionAt(box.id) ?? null

  return (
    <div className="relative select-none" {...reorder?.getItemProps(box.id)}>
      {insertion === 'before' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-lab-accent rounded-full -translate-y-1" />}
      <button
        type="button"
        data-box-id={box.id}
        onClick={onSelect}
        className={`card p-3 w-full text-left transition-all ${
          isSelected ? 'ring-2 ring-lab-accent border-lab-accent/50' : 'hover:border-lab-border-light'
        } ${isDragging ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <SortOrderBadge
            value={box.sort_order}
            onCommit={(n) => { moveBoxSortOrder(box.id, n).then(() => onRefresh?.()) }}
          />
          {box.name}
        </div>
        <div className="text-xs text-lab-muted mt-0.5">
          {box.storage_location ?? '-'} {box.storage_temperature ?? ''}
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-lab-muted mb-1">
            <span>占用率</span>
            <span className="tabular-nums text-lab-text">{occupied}/{capacity}</span>
          </div>
          <div className="h-1.5 bg-lab-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-lab-accent rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>
      {insertion === 'after' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lab-accent rounded-full translate-y-1" />}
    </div>
  )
}
