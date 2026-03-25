import { useState, useEffect, useCallback } from 'react'
import type { PrimerTube } from '@/types'
import { updateTube } from '@/api/tubes'
import Modal from '@/components/common/Modal'

interface Props {
  readonly open: boolean
  readonly tube: PrimerTube | null
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function EditTubeModal({ open, tube, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ batch_number: '', tube_number: '', dissolution_date: '', initial_volume_ul: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && tube) {
      setForm({
        batch_number: tube.batch_number,
        tube_number: tube.tube_number ?? '',
        dissolution_date: tube.dissolution_date ?? '',
        initial_volume_ul: tube.initial_volume_ul.toString(),
      })
    }
  }, [open, tube])

  const set = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!tube) return
    setSaving(true)
    try {
      await updateTube(tube.id, {
        batch_number: form.batch_number,
        tube_number: form.tube_number || null,
        dissolution_date: form.dissolution_date || null,
        initial_volume_ul: Number(form.initial_volume_ul),
      })
      onSuccess()
      onClose()
    } catch { /* handled by interceptor */ }
    setSaving(false)
  }, [tube, form, onSuccess, onClose])

  if (!tube) return null

  return (
    <Modal open={open} title="编辑分管信息" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">批号</label>
          <input type="text" value={form.batch_number} onChange={(e) => set('batch_number', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">分管编号</label>
          <input type="text" value={form.tube_number} onChange={(e) => set('tube_number', e.target.value)} className="input-field" placeholder="如: #1, #2, A, B..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">定容日期</label>
            <input type="date" value={form.dissolution_date} onChange={(e) => set('dissolution_date', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">初始体积 (uL)</label>
            <input type="number" value={form.initial_volume_ul} onChange={(e) => set('initial_volume_ul', e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={saving || !form.batch_number || !form.initial_volume_ul} onClick={handleSave}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
