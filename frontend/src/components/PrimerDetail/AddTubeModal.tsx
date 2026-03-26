import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/common/Modal'
import { createTube } from '@/api/tubes'
import { extractError } from '@/utils/extractError'

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
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setBatch('')
    setTubeNumber('')
    setDate('')
    setVolume('')
    setError('')
  }, [open])

  const handleSubmit = useCallback(async () => {
    if (!isValid(batch, date, volume)) return
    setSubmitting(true)
    setError('')
    try {
      await createTube(primerId, {
        batch_number: batch.trim(),
        tube_number: tubeNumber || undefined,
        dissolution_date: date,
        initial_volume_ul: parseFloat(volume),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '添加失败'))
    }
    setSubmitting(false)
  }, [primerId, batch, tubeNumber, date, volume, onSuccess, onClose])

  return (
    <Modal open={open} title="添加新管" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">批号 *</label>
          <input
            type="text"
            value={batch}
            onChange={(e) => {
              setBatch(e.target.value)
              setError('')
            }}
            className="input-field"
            placeholder="如: HS260304046"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">分管编号</label>
          <input
            type="text"
            value={tubeNumber}
            onChange={(e) => {
              setTubeNumber(e.target.value)
              setError('')
            }}
            className="input-field"
            placeholder="如: #1, #2, A, B..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">定容日期 *</label>
          <DateInput value={date} onChange={(v) => { setDate(v); setError('') }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">产量 (uL) *</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={volume}
            onChange={(e) => {
              setVolume(e.target.value)
              setError('')
            }}
            className="input-field"
            placeholder="初始体积"
          />
        </div>
        {error && <p className="rounded-lg border border-lab-danger/30 bg-lab-danger/10 px-3 py-2 text-sm text-lab-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!isValid(batch, date, volume) || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function DateInput({ value, onChange }: { readonly value: string; readonly onChange: (iso: string) => void }) {
  function toDisplay(iso: string): string {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${m}/${d}/${y}`
  }

  function toISO(input: string): string {
    const cleaned = input.replace(/[^0-9/]/g, '')
    const parts = cleaned.split('/')
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
    }
    return ''
  }

  function handleInput(raw: string) {
    const iso = toISO(raw)
    if (iso) onChange(iso)
    else if (!raw) onChange('')
  }

  return (
    <input
      type="text"
      value={toDisplay(value)}
      onChange={(e) => handleInput(e.target.value)}
      placeholder="MM/DD/YYYY"
      className="input-field"
    />
  )
}

function isValid(batch: string, date: string, volume: string): boolean {
  if (!batch.trim() || !date.trim() || !volume.trim()) return false
  return Number.isFinite(Number(volume))
}
