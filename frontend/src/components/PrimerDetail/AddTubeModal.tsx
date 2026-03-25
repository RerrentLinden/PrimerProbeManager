import { useState, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { createTube } from '@/api/tubes'

interface Props {
  readonly open: boolean
  readonly primerId: number
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function AddTubeModal({ open, primerId, onClose, onSuccess }: Props) {
  const [batch, setBatch] = useState('')
  const [tubeNumber, setTubeNumber] = useState('')
  const [date, setDate] = useState('')
  const [volume, setVolume] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!batch || !volume) return
    setSubmitting(true)
    try {
      await createTube(primerId, {
        batch_number: batch,
        tube_number: tubeNumber || undefined,
        dissolution_date: date || undefined,
        initial_volume_ul: parseFloat(volume),
      })
      setBatch('')
      setTubeNumber('')
      setDate('')
      setVolume('')
      onSuccess()
      onClose()
    } catch { /* handled by interceptor */ }
    setSubmitting(false)
  }, [primerId, batch, date, volume, onSuccess, onClose])

  return (
    <Modal open={open} title="添加新管" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">批号 *</label>
          <input
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="input-field"
            placeholder="如: HS260304046"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">分管编号</label>
          <input
            type="text"
            value={tubeNumber}
            onChange={(e) => setTubeNumber(e.target.value)}
            className="input-field"
            placeholder="如: #1, #2, A, B..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">定容日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">产量 (uL) *</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="input-field"
            placeholder="初始体积"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!batch || !volume || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
