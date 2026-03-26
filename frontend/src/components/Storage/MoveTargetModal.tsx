import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { fetchBoxes, fetchBox } from '@/api/boxes'
import { moveTube } from '@/api/tubes'
import type { FreezerBox, GridSlot } from '@/types'
import { rowLabel } from '@/utils/format'
import { extractError } from '@/utils/extractError'

interface Props {
  readonly open: boolean
  readonly tubeId: number | null
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function MoveTargetModal({ open, tubeId, onClose, onSuccess }: Props) {
  const [boxes, setBoxes] = useState<FreezerBox[]>([])
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [grid, setGrid] = useState<GridSlot[][] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    fetchBoxes().then(({ data }) => setBoxes(data)).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!selectedBox) { setGrid(null); return }
    setError('')
    fetchBox(selectedBox).then(({ data }) => setGrid(data.grid)).catch(() => {})
  }, [selectedBox])

  const handleSelectSlot = useCallback(async (row: number, col: number) => {
    if (!tubeId || !selectedBox) return
    setSubmitting(true)
    setError('')
    try {
      await moveTube(tubeId, selectedBox, row, col)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '移动失败'))
    }
    setSubmitting(false)
  }, [tubeId, selectedBox, onSuccess, onClose])

  return (
    <Modal open={open} title="选择目标位置" onClose={onClose} width="max-w-lg">
      <div className="space-y-4">
        <select
          className="input-field"
          value={selectedBox ?? ''}
          onChange={(e) => {
            setSelectedBox(Number(e.target.value) || null)
            setError('')
          }}
        >
          <option value="">选择目标盒子</option>
          {boxes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {error && <p className="rounded-lg border border-lab-danger/30 bg-lab-danger/10 px-3 py-2 text-sm text-lab-danger">{error}</p>}

        {grid && (
          <div className="space-y-1 max-h-64 overflow-auto">
            {grid.map((rowSlots, ri) => (
              <div key={ri} className="flex gap-1 items-center">
                <span className="w-5 text-xs text-lab-muted text-center">{rowLabel(ri)}</span>
                {rowSlots.map((slot) => (
                  <button
                    key={`${slot.row}-${slot.col}`}
                    type="button"
                    disabled={!!slot.tube || submitting}
                    onClick={() => handleSelectSlot(slot.row, slot.col)}
                    className={`w-8 h-8 rounded border text-[10px] ${
                      slot.tube
                        ? 'bg-lab-metal border-lab-metal-edge cursor-not-allowed text-lab-faint'
                        : 'bg-lab-success/10 border-lab-success/40 hover:bg-lab-success/20 cursor-pointer'
                    }`}
                  >
                    {slot.tube ? 'x' : ''}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
