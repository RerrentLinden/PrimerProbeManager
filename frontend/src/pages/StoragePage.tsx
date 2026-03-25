import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchBoxes, fetchBox } from '@/api/boxes'
import { archiveTube } from '@/api/tubes'
import type { FreezerBox, GridSlot } from '@/types'
import BoxList from '@/components/Storage/BoxList'
import BoxGrid from '@/components/Storage/BoxGrid'
import PlaceTubeModal from '@/components/Storage/PlaceTubeModal'
import CreateBoxModal from '@/components/Storage/CreateBoxModal'
import MoveTargetModal from '@/components/Storage/MoveTargetModal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function StoragePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const highlightQuery = searchParams.get('highlight') ?? ''

  const [boxes, setBoxes] = useState<FreezerBox[]>([])
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null)
  const [grid, setGrid] = useState<GridSlot[][] | null>(null)
  const [selectedBox, setSelectedBox] = useState<FreezerBox | null>(null)
  const [loading, setLoading] = useState(true)

  const [placeTarget, setPlaceTarget] = useState<{ row: number; col: number } | null>(null)
  const [showCreateBox, setShowCreateBox] = useState(false)
  const [moveTubeId, setMoveTubeId] = useState<number | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<GridSlot | null>(null)

  const loadBoxes = useCallback(async () => {
    try {
      const { data } = await fetchBoxes()
      setBoxes(data)
      if (data.length > 0 && !selectedBoxId) {
        setSelectedBoxId(data[0].id)
      }
    } catch { /* handled */ }
    setLoading(false)
  }, [selectedBoxId])

  const loadGrid = useCallback(async () => {
    if (!selectedBoxId) return
    try {
      const { data } = await fetchBox(selectedBoxId)
      setGrid(data.grid)
      setSelectedBox(data)
    } catch { /* handled */ }
  }, [selectedBoxId])

  useEffect(() => { loadBoxes() }, [loadBoxes])
  useEffect(() => { loadGrid() }, [loadGrid])

  const handleSlotAction = useCallback(
    (action: string, slot: GridSlot) => {
      if (!slot.tube) return
      if (action === 'detail') navigate(`/primers/${slot.tube.primer_id}`)
      if (action === 'move') setMoveTubeId(slot.tube.tube_id)
      if (action === 'archive') setArchiveTarget(slot)
    },
    [navigate],
  )

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveTarget?.tube) return
    await archiveTube(archiveTarget.tube.tube_id)
    setArchiveTarget(null)
    loadGrid()
  }, [archiveTarget, loadGrid])

  const refresh = useCallback(() => { loadBoxes(); loadGrid() }, [loadBoxes, loadGrid])

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Box list: sidebar on PC, selector on mobile */}
      <div className="lg:w-64 shrink-0">
        <div className="hidden lg:block">
          <BoxList
            boxes={boxes}
            selectedId={selectedBoxId}
            onSelect={setSelectedBoxId}
            onCreateBox={() => setShowCreateBox(true)}
          />
        </div>
        <MobileBoxSelector
          boxes={boxes}
          selectedId={selectedBoxId}
          onSelect={setSelectedBoxId}
          onCreateBox={() => setShowCreateBox(true)}
        />
      </div>

      {/* Grid area */}
      <div className="flex-1 card p-4">
        {!selectedBox || !grid ? (
          <EmptyState title="选择一个盒子" description="从左侧列表选择或新建盒子" />
        ) : (
          <BoxGrid
            box={selectedBox}
            grid={grid}
            searchHighlight={highlightQuery}
            onEmptySlotClick={(r, c) => setPlaceTarget({ row: r, col: c })}
            onSlotAction={handleSlotAction}
          />
        )}
      </div>

      {/* Modals */}
      {placeTarget && selectedBoxId && (
        <PlaceTubeModal
          open
          boxId={selectedBoxId}
          row={placeTarget.row}
          col={placeTarget.col}
          onClose={() => setPlaceTarget(null)}
          onSuccess={refresh}
        />
      )}

      <CreateBoxModal open={showCreateBox} onClose={() => setShowCreateBox(false)} onSuccess={refresh} />

      <MoveTargetModal
        open={moveTubeId !== null}
        tubeId={moveTubeId}
        onClose={() => setMoveTubeId(null)}
        onSuccess={refresh}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title="归档引物管"
        message={`确定要归档 ${archiveTarget?.tube?.primer_name ?? ''} 吗？归档后将从盒中移出。`}
        confirmLabel="归档"
        danger
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  )
}

function MobileBoxSelector({ boxes, selectedId, onSelect, onCreateBox }: {
  readonly boxes: FreezerBox[]
  readonly selectedId: number | null
  readonly onSelect: (id: number) => void
  readonly onCreateBox: () => void
}) {
  return (
    <div className="lg:hidden flex gap-2">
      <select
        className="input-field flex-1"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {boxes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button type="button" className="btn-primary text-sm shrink-0" onClick={onCreateBox}>
        新建
      </button>
    </div>
  )
}
