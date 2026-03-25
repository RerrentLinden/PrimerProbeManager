import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchBoxes, fetchBox, searchPlacedTubes } from '@/api/boxes'
import type { TubeSearchResult } from '@/api/boxes'
import { archiveTube, moveTube, createUsageLog } from '@/api/tubes'
import type { FreezerBox, GridSlot, GridTubeInfo } from '@/types'
import BoxList from '@/components/Storage/BoxList'
import BoxGrid from '@/components/Storage/BoxGrid'
import SlotPopupMenu from '@/components/Storage/SlotPopupMenu'
import PlaceTubeModal from '@/components/Storage/PlaceTubeModal'
import CreateBoxModal from '@/components/Storage/CreateBoxModal'
import MoveTargetModal from '@/components/Storage/MoveTargetModal'
import EditBoxModal from '@/components/Storage/EditBoxModal'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function StoragePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlHighlight = searchParams.get('highlight') ?? ''
  const boxParam = searchParams.get('box')
  const searchPanelRef = useRef<HTMLDivElement | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localHighlight, setLocalHighlight] = useState('')
  const highlightQuery = localHighlight || urlHighlight

  const [boxes, setBoxes] = useState<FreezerBox[]>([])
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(boxParam ? Number(boxParam) : null)
  const [grid, setGrid] = useState<GridSlot[][] | null>(null)
  const [selectedBox, setSelectedBox] = useState<FreezerBox | null>(null)
  const [loading, setLoading] = useState(true)

  const [placeTarget, setPlaceTarget] = useState<{ row: number; col: number } | null>(null)
  const [showCreateBox, setShowCreateBox] = useState(false)
  const [moveTubeIdCrossBox, setMoveTubeIdCrossBox] = useState<number | null>(null)
  const [editingBox, setEditingBox] = useState(false)

  // Tube search
  const [tubeQuery, setTubeQuery] = useState('')
  const [tubeResults, setTubeResults] = useState<TubeSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // Popup menu
  const [menuTube, setMenuTube] = useState<GridTubeInfo | null>(null)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  // Archive
  const [archiveTubeId, setArchiveTubeId] = useState<number | null>(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiving, setArchiving] = useState(false)

  // Usage
  const [usageTubeId, setUsageTubeId] = useState<number | null>(null)
  const [usageVol, setUsageVol] = useState('')
  const [usagePurpose, setUsagePurpose] = useState('')
  const [usageSubmitting, setUsageSubmitting] = useState(false)

  const clearHighlightTimeout = useCallback(() => {
    if (!highlightTimeoutRef.current) return
    clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = null
  }, [])

  const loadBoxes = useCallback(async () => {
    try {
      const { data } = await fetchBoxes()
      setBoxes(data)
      if (data.length > 0 && !selectedBoxId) setSelectedBoxId(data[0].id)
    } catch { /* handled */ }
    setLoading(false)
  }, [selectedBoxId])

  const loadGrid = useCallback(async () => {
    if (!selectedBoxId) return
    try {
      const { data } = await fetchBox(selectedBoxId)
      setGrid(data.grid); setSelectedBox(data)
    } catch { /* handled */ }
  }, [selectedBoxId])

  useEffect(() => { loadBoxes() }, [loadBoxes])
  useEffect(() => { loadGrid() }, [loadGrid])
  const refresh = useCallback(() => { loadBoxes(); loadGrid() }, [loadBoxes, loadGrid])

  useEffect(() => {
    if (!boxParam) return
    const nextBoxId = Number(boxParam)
    if (Number.isNaN(nextBoxId)) return
    setSelectedBoxId(nextBoxId)
  }, [boxParam])

  // Close search results on click outside
  useEffect(() => {
    if (!showResults) return
    const handler = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (searchPanelRef.current?.contains(target)) return
      setShowResults(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showResults])

  useEffect(() => () => clearHighlightTimeout(), [clearHighlightTimeout])

  // Tube click → popup menu
  const handleTubeClick = useCallback((slot: GridSlot, pos: { x: number; y: number }) => {
    if (slot.tube) { setMenuTube(slot.tube); setMenuPos(pos) }
  }, [])

  // Drag drop (same box or cross-box after switch)
  const handleMoveTube = useCallback(async (tubeId: number, toRow: number, toCol: number) => {
    if (!selectedBoxId) return
    try { await moveTube(tubeId, selectedBoxId, toRow, toCol); await loadGrid(); loadBoxes() } catch { /* handled */ }
  }, [selectedBoxId, loadGrid, loadBoxes])

  // Archive
  const handleArchive = useCallback(async () => {
    if (!archiveTubeId || !archiveReason.trim()) return
    setArchiving(true)
    try { await archiveTube(archiveTubeId, archiveReason.trim()); setArchiveTubeId(null); setArchiveReason(''); refresh() } catch { /* handled */ }
    setArchiving(false)
  }, [archiveTubeId, archiveReason, refresh])

  // Usage
  const handleUsage = useCallback(async () => {
    if (!usageTubeId || !usageVol) return
    setUsageSubmitting(true)
    try { await createUsageLog(usageTubeId, { volume_used_ul: Number(usageVol), purpose: usagePurpose || undefined }); setUsageTubeId(null); setUsageVol(''); setUsagePurpose(''); loadGrid() } catch { /* handled */ }
    setUsageSubmitting(false)
  }, [usageTubeId, usageVol, usagePurpose, loadGrid])

  const handleTubeResultSelect = useCallback((result: TubeSearchResult) => {
    clearHighlightTimeout()
    setSelectedBoxId(result.box_id)
    setLocalHighlight(result.batch_number || result.primer_name)
    setShowResults(false)
    setTubeQuery('')
    setTubeResults([])
    highlightTimeoutRef.current = setTimeout(() => {
      setLocalHighlight('')
      highlightTimeoutRef.current = null
    }, 3000)
  }, [clearHighlightTimeout])

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="lg:w-64 shrink-0">
        <div className="hidden lg:block">
          <BoxList boxes={boxes} selectedId={selectedBoxId} onSelect={setSelectedBoxId} onCreateBox={() => setShowCreateBox(true)} />
        </div>
        <MobileBoxSelector boxes={boxes} selectedId={selectedBoxId} onSelect={setSelectedBoxId} onCreateBox={() => setShowCreateBox(true)} />
      </div>

      <div className="flex-1 card p-4">
        {!selectedBox || !grid ? (
          <EmptyState title="选择一个盒子" description="从左侧列表选择或新建盒子" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div ref={searchPanelRef} className="relative flex-1">
                <input
                  type="text"
                  value={tubeQuery}
                  onChange={(e) => {
                    const q = e.target.value
                    setTubeQuery(q)
                    if (q.trim().length >= 2) {
                      searchPlacedTubes(q.trim()).then(({ data }) => { setTubeResults(data); setShowResults(true) }).catch(() => {})
                    } else {
                      setTubeResults([]); setShowResults(false)
                    }
                  }}
                  onFocus={() => { if (tubeResults.length > 0) setShowResults(true) }}
                  placeholder="搜索分管名称或批号..."
                  className="input-field text-sm w-full"
                />
                {showResults && tubeResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-40 max-h-60 overflow-y-auto">
                    {tubeResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 last:border-0"
                        onClick={() => handleTubeResultSelect(r)}
                      >
                        <span className="font-medium">{r.primer_name}</span>
                        <span className="text-xs text-slate-400">{r.batch_number}{r.tube_number ? ` #${r.tube_number}` : ''}</span>
                        <span className="ml-auto text-xs text-slate-400">{r.box_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="btn-secondary text-xs py-1 px-2.5 shrink-0" onClick={() => setEditingBox(true)}>编辑盒子</button>
            </div>
            <BoxGrid
              box={selectedBox}
              grid={grid}
              searchHighlight={highlightQuery}
              onEmptySlotClick={(r, c) => setPlaceTarget({ row: r, col: c })}
              onTubeClick={handleTubeClick}
              onMoveTube={handleMoveTube}
              onSwitchBox={setSelectedBoxId}
            />
          </>
        )}
      </div>

      {/* Popup context menu */}
      {menuTube && (
        <SlotPopupMenu
          tube={menuTube}
          position={menuPos}
          onClose={() => setMenuTube(null)}
          onDetail={() => { navigate(`/primers/${menuTube.primer_id}`); setMenuTube(null) }}
          onUsage={() => { setUsageTubeId(menuTube.tube_id); setMenuTube(null) }}
          onMoveCross={() => { setMoveTubeIdCrossBox(menuTube.tube_id); setMenuTube(null) }}
          onArchive={() => { setArchiveTubeId(menuTube.tube_id); setArchiveReason(''); setMenuTube(null) }}
        />
      )}

      {/* Modals */}
      {placeTarget && selectedBoxId && (
        <PlaceTubeModal open boxId={selectedBoxId} row={placeTarget.row} col={placeTarget.col} onClose={() => setPlaceTarget(null)} onSuccess={refresh} />
      )}
      <CreateBoxModal open={showCreateBox} onClose={() => setShowCreateBox(false)} onSuccess={refresh} />
      <MoveTargetModal open={moveTubeIdCrossBox !== null} tubeId={moveTubeIdCrossBox} onClose={() => setMoveTubeIdCrossBox(null)} onSuccess={refresh} />

      {/* Archive */}
      <Modal open={archiveTubeId !== null} title="归档引物管" onClose={() => setArchiveTubeId(null)}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">归档原因 *</label>
            <input type="text" value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleArchive()} className="input-field" placeholder="用完、过期、污染..." autoFocus />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setArchiveTubeId(null)}>取消</button>
            <button type="button" className="btn-danger" disabled={!archiveReason.trim() || archiving} onClick={handleArchive}>{archiving ? '...' : '确认归档'}</button>
          </div>
        </div>
      </Modal>

      {/* Usage */}
      <Modal open={usageTubeId !== null} title="记录用量" onClose={() => setUsageTubeId(null)}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">用量 (uL) *</label>
            <input type="number" value={usageVol} onChange={(e) => setUsageVol(e.target.value)} className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">用途</label>
            <input type="text" value={usagePurpose} onChange={(e) => setUsagePurpose(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setUsageTubeId(null)}>取消</button>
            <button type="button" className="btn-primary" disabled={!usageVol || usageSubmitting} onClick={handleUsage}>{usageSubmitting ? '...' : '确认'}</button>
          </div>
        </div>
      </Modal>

      {/* Edit box */}
      {selectedBox && (
        <EditBoxModal open={editingBox} box={selectedBox} onClose={() => setEditingBox(false)} onSuccess={refresh} onDelete={() => { setSelectedBoxId(null); setSelectedBox(null); setGrid(null); refresh() }} />
      )}
    </div>
  )
}

function MobileBoxSelector({ boxes, selectedId, onSelect, onCreateBox }: {
  readonly boxes: FreezerBox[]; readonly selectedId: number | null; readonly onSelect: (id: number) => void; readonly onCreateBox: () => void
}) {
  return (
    <div className="lg:hidden flex gap-2">
      <select className="input-field flex-1" value={selectedId ?? ''} onChange={(e) => onSelect(Number(e.target.value))}>
        {boxes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button type="button" className="btn-primary text-sm shrink-0" onClick={onCreateBox}>新建</button>
    </div>
  )
}
