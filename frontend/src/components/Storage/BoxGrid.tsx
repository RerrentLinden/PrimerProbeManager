import { useRef, useCallback, useEffect, useState } from 'react'
import type { FreezerBox, GridSlot } from '@/types'
import { rowLabel } from '@/utils/format'
import GridSlotCell from './GridSlotCell'
import { LONG_PRESS_DELAY_MS } from '@/utils/constants'

interface Props {
  readonly box: FreezerBox
  readonly grid: GridSlot[][]
  readonly searchHighlight: string
  readonly onEmptySlotClick: (row: number, col: number) => void
  readonly onTubeClick: (slot: GridSlot, pos: { x: number; y: number }) => void
  readonly onMoveTube: (tubeId: number, toRow: number, toCol: number) => void
  readonly onSwitchBox?: (boxId: number) => void
}

interface DragState {
  tubeId: number
  label: string
  x: number
  y: number
  hoverRow: number | null
  hoverCol: number | null
}

export default function BoxGrid({ box, grid, searchHighlight, onEmptySlotClick, onTubeClick, onMoveTube, onSwitchBox }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const isHighlighted = useCallback((slot: GridSlot) => {
    if (!searchHighlight || !slot.tube) return false
    const q = searchHighlight.toLowerCase()
    return slot.tube.primer_name.toLowerCase().includes(q) || slot.tube.batch_number.toLowerCase().includes(q)
  }, [searchHighlight])

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }, [])

  // Keep dragRef in sync for event listeners
  useEffect(() => { dragRef.current = drag }, [drag])

  // Document-level pointer listeners for drag (so dragging outside grid still works)
  useEffect(() => {
    const handlePointerCancel = () => setDrag(null)

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      e.preventDefault()
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null

      // Check if hovering over a box card in sidebar
      const boxCard = el?.closest<HTMLElement>('[data-box-id]')
      if (boxCard && onSwitchBox) {
        const targetBoxId = Number(boxCard.dataset.boxId)
        if (targetBoxId && targetBoxId !== box.id) {
          onSwitchBox(targetBoxId)
        }
      }

      // Check grid cell hit
      const cell = el?.closest<HTMLElement>('[data-row]')
      const hoverRow = cell?.dataset.empty === '1' ? Number(cell.dataset.row) : null
      const hoverCol = cell?.dataset.empty === '1' ? Number(cell.dataset.col) : null

      setDrag((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY, hoverRow, hoverCol } : null)
    }

    const onUp = (_e: PointerEvent) => {
      if (!dragRef.current) return
      const d = dragRef.current
      if (d.hoverRow !== null && d.hoverCol !== null) {
        onMoveTube(d.tubeId, d.hoverRow, d.hoverCol)
      }
      setDrag(null)
    }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [box.id, onMoveTube, onSwitchBox])

  // Track whether a pointerDown happened on a cell at all (for pointerUp tap detection)
  const tapTarget = useRef<{ row: number; col: number; clientX: number; clientY: number } | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-row]')
    if (!cell) return

    const row = Number(cell.dataset.row)
    const col = Number(cell.dataset.col)
    tapTarget.current = { row, col, clientX: e.clientX, clientY: e.clientY }

    // Only start long-press timer for occupied cells (for drag)
    if (cell.dataset.empty === '1') return
    const slot = grid[row]?.[col]
    if (!slot?.tube) return

    const tube = slot.tube
    const startX = e.clientX
    const startY = e.clientY

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      tapTarget.current = null
      setDrag({
        tubeId: tube.tube_id,
        label: tube.primer_name,
        x: startX,
        y: startY,
        hoverRow: null,
        hoverCol: null,
      })
    }, LONG_PRESS_DELAY_MS)
  }, [grid])

  const handlePointerMoveLocal = useCallback((_e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimer()
    // If moved too far, cancel tap
    tapTarget.current = null
  }, [clearTimer])

  const handlePointerUpLocal = useCallback((e: React.PointerEvent) => {
    clearTimer()
    const tap = tapTarget.current
    tapTarget.current = null
    if (!tap) return

    const slot = grid[tap.row]?.[tap.col]
    if (!slot) return
    if (slot.tube) onTubeClick(slot, { x: e.clientX, y: e.clientY })
    else onEmptySlotClick(tap.row, tap.col)
  }, [grid, clearTimer, onTubeClick, onEmptySlotClick])

  useEffect(() => () => clearTimer(), [clearTimer])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{box.name}</h2>
          <p className="text-xs text-slate-500">{box.storage_location ?? ''} {box.storage_temperature ?? ''}</p>
        </div>
      </div>

      {drag && (
        <div className="mb-3 flex items-center gap-2 text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5">
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          拖动到空位放置，或拖到左侧盒子切换目标盒
        </div>
      )}

      <div
        className="overflow-x-auto touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveLocal}
        onPointerUp={handlePointerUpLocal}
        onPointerCancel={clearTimer}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ColHeaders cols={box.cols} />
        <div className="space-y-1">
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1">
              <span className="w-6 text-center text-xs font-medium text-slate-500 shrink-0">{rowLabel(ri)}</span>
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${box.cols}, minmax(0, 1fr))` }}>
                {row.map((slot) => (
                  <GridSlotCell
                    key={`${slot.row}-${slot.col}`}
                    slot={slot}
                    highlighted={isHighlighted(slot)}
                    isDragSource={drag?.tubeId === slot.tube?.tube_id}
                    isDropTarget={!!drag && !slot.tube}
                    isHoverTarget={drag?.hoverRow === slot.row && drag?.hoverCol === slot.col}
                    totalCols={box.cols}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {drag && (
        <div className="fixed z-50 pointer-events-none transition-none" style={{ left: drag.x - 30, top: drag.y - 30 }}>
          <div className="w-[60px] h-[60px] rounded-xl bg-blue-500 text-white shadow-2xl flex flex-col items-center justify-center opacity-90">
            <span className="text-[9px] font-bold truncate max-w-[56px]">{drag.label}</span>
          </div>
        </div>
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
          <span key={i} className="text-center text-xs font-medium text-slate-500">{i + 1}</span>
        ))}
      </div>
    </div>
  )
}
