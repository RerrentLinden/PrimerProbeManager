import { useCallback, useEffect, useRef, useState } from 'react'
import { LONG_PRESS_DELAY_MS } from '@/utils/constants'

const REORDER_ATTR = 'data-reorder-id'
const DRAG_THRESHOLD_PX = 10

interface DragState {
  itemId: number
  label: string
  x: number
  y: number
  overId: number | null
  position: 'before' | 'after' | null
}

export interface DragReorderResult<T> {
  readonly items: T[]
  readonly drag: DragState | null
  readonly getItemProps: (id: number) => {
    readonly 'data-reorder-id': string
    readonly onDragStart: (e: React.DragEvent) => void
    readonly onPointerDown: (e: React.PointerEvent) => void
    readonly onPointerMove: (e: React.PointerEvent) => void
    readonly onPointerUp: (e: React.PointerEvent) => void
    readonly onContextMenu: (e: React.MouseEvent) => void
    readonly onClickCapture: (e: React.MouseEvent) => void
  }
  readonly isDragSource: (id: number) => boolean
  readonly insertionAt: (id: number) => 'before' | 'after' | null
}

interface Options<T> {
  readonly items: readonly T[]
  readonly getId: (item: T) => number
  readonly getLabel: (item: T) => string
  readonly onReorder: (orderedIds: number[]) => Promise<void>
}

export function useDragReorder<T>(opts: Options<T>): DragReorderResult<T> {
  const { items: source, getId, getLabel, onReorder } = opts
  const [ordered, setOrdered] = useState<T[]>(() => [...source])
  const [drag, setDrag] = useState<DragState | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const orderedRef = useRef<T[]>(ordered)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => { orderedRef.current = ordered }, [ordered])
  useEffect(() => { dragRef.current = drag }, [drag])
  useEffect(() => { if (!dragRef.current) setOrdered([...source]) }, [source])

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (timerRef.current && startPosRef.current) {
        const dx = e.clientX - startPosRef.current.x
        const dy = e.clientY - startPosRef.current.y
        if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          clearTimer()
          startPosRef.current = null
        }
      }
      if (!dragRef.current) return
      e.preventDefault()
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>(`[${REORDER_ATTR}]`)
      let overId: number | null = null
      let position: 'before' | 'after' | null = null
      if (el) {
        const id = Number(el.getAttribute(REORDER_ATTR))
        if (id !== dragRef.current.itemId) {
          const rect = el.getBoundingClientRect()
          overId = id
          position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
        }
      }
      setDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY, overId, position } : null)
    }

    const onUp = () => {
      clearTimer()
      startPosRef.current = null
      if (!dragRef.current) return
      const d = dragRef.current
      setDrag(null)
      if (d.overId !== null && d.position !== null) {
        const items = orderedRef.current
        const srcIdx = items.findIndex(it => getId(it) === d.itemId)
        const overIdx = items.findIndex(it => getId(it) === d.overId)
        if (srcIdx >= 0 && overIdx >= 0 && srcIdx !== overIdx) {
          const next = [...items]
          const [moved] = next.splice(srcIdx, 1)
          const insertIdx = d.position === 'before'
            ? (srcIdx < overIdx ? overIdx - 1 : overIdx)
            : (srcIdx < overIdx ? overIdx : overIdx + 1)
          next.splice(insertIdx, 0, moved)
          setOrdered(next)
          void onReorder(next.map(getId))
        }
      }
      suppressClickRef.current = true
      setTimeout(() => { suppressClickRef.current = false }, 300)
    }

    const onCancel = () => { clearTimer(); startPosRef.current = null; setDrag(null) }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancel)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
    }
  }, [clearTimer, getId, onReorder])

  useEffect(() => () => clearTimer(), [clearTimer])

  const getItemProps = useCallback((itemId: number) => ({
    [REORDER_ATTR]: String(itemId),
    onDragStart(e: React.DragEvent) { e.preventDefault() },
    onPointerDown(e: React.PointerEvent) {
      if (dragRef.current) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const startX = e.clientX, startY = e.clientY
      startPosRef.current = { x: startX, y: startY }
      clearTimer()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const item = orderedRef.current.find(it => getId(it) === itemId)
        if (!item) return
        suppressClickRef.current = true
        setDrag({ itemId, label: getLabel(item), x: startX, y: startY, overId: null, position: null })
      }, LONG_PRESS_DELAY_MS)
    },
    onPointerMove(_e: React.PointerEvent) {
      // handled at document level
    },
    onPointerUp(_e: React.PointerEvent) {
      // handled at document level; clean up timer for short tap
      if (timerRef.current) { clearTimer(); startPosRef.current = null }
    },
    onContextMenu(e: React.MouseEvent) { e.preventDefault() },
    onClickCapture(e: React.MouseEvent) {
      if (suppressClickRef.current) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
  } as const), [clearTimer, getId, getLabel])

  return {
    items: ordered,
    drag,
    getItemProps,
    isDragSource: useCallback((id: number) => drag?.itemId === id, [drag]),
    insertionAt: useCallback((id: number) => {
      if (!drag || drag.overId !== id) return null
      return drag.position
    }, [drag]),
  }
}
