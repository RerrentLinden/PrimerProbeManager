import { useState, useCallback } from 'react'
import type { FreezerBox, GridSlot } from '@/types'
import { rowLabel } from '@/utils/format'
import GridSlotCell from './GridSlotCell'
import SlotContextMenu from './SlotContextMenu'
import SearchInput from '@/components/common/SearchInput'

interface Props {
  readonly box: FreezerBox
  readonly grid: GridSlot[][]
  readonly searchHighlight: string
  readonly onEmptySlotClick: (row: number, col: number) => void
  readonly onSlotAction: (action: string, slot: GridSlot) => void
}

export default function BoxGrid({ box, grid, searchHighlight, onEmptySlotClick, onSlotAction }: Props) {
  const [menuSlot, setMenuSlot] = useState<GridSlot | null>(null)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [localSearch, setLocalSearch] = useState('')

  const effectiveSearch = searchHighlight || localSearch

  const isHighlighted = useCallback(
    (slot: GridSlot) => {
      if (!effectiveSearch || !slot.tube) return false
      const q = effectiveSearch.toLowerCase()
      return (
        slot.tube.primer_name.toLowerCase().includes(q) ||
        slot.tube.batch_number.toLowerCase().includes(q)
      )
    },
    [effectiveSearch],
  )

  const handleContextAction = useCallback(
    (slot: GridSlot, action: string) => {
      if (action === 'menu') {
        setMenuSlot(slot)
        setMenuPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }
    },
    [],
  )

  const handleSlotClick = useCallback(
    (slot: GridSlot) => {
      if (!slot.tube) {
        onEmptySlotClick(slot.row, slot.col)
      } else {
        setMenuSlot(slot)
        setMenuPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }
    },
    [onEmptySlotClick],
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{box.name}</h2>
          <p className="text-xs text-slate-500">
            {box.storage_location ?? ''} {box.storage_temperature ?? ''}
          </p>
        </div>
        <SearchInput
          placeholder="搜索管..."
          onSearch={setLocalSearch}
          className="w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <ColHeaders cols={box.cols} />
        <div className="space-y-1">
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1">
              <span className="w-6 text-center text-xs font-medium text-slate-500 shrink-0">
                {rowLabel(ri)}
              </span>
              <div
                className="flex-1 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${box.cols}, minmax(0, 1fr))` }}
              >
                {row.map((slot) => (
                  <GridSlotCell
                    key={`${slot.row}-${slot.col}`}
                    slot={slot}
                    highlighted={isHighlighted(slot)}
                    onClick={() => handleSlotClick(slot)}
                    onContextAction={(action) => handleContextAction(slot, action)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {menuSlot && (
        <SlotContextMenu
          slot={menuSlot}
          position={menuPos}
          onAction={(action) => {
            onSlotAction(action, menuSlot)
            setMenuSlot(null)
          }}
          onClose={() => setMenuSlot(null)}
        />
      )}
    </div>
  )
}

function ColHeaders({ cols }: { readonly cols: number }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="w-6 shrink-0" />
      <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className="text-center text-xs font-medium text-slate-500">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}
