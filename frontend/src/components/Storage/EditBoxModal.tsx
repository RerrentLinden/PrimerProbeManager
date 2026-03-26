import { useState, useEffect, useCallback } from 'react'
import { updateBox, deleteBox } from '@/api/boxes'
import type { FreezerBox } from '@/types'
import Modal from '@/components/common/Modal'

interface Props {
  readonly open: boolean
  readonly box: FreezerBox
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly onDelete: () => void
}

export default function EditBoxModal({ open, box, onClose, onSuccess, onDelete }: Props) {
  const [form, setForm] = useState({ name: '', storage_location: '', storage_temperature: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({
      name: box.name,
      storage_location: box.storage_location ?? '',
      storage_temperature: box.storage_temperature ?? '',
    })
    setDeleteError('')
  }, [open, box])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateBox(box.id, {
        name: form.name,
        storage_location: form.storage_location || null,
        storage_temperature: form.storage_temperature || null,
      })
      onSuccess()
      onClose()
    } catch {
      /* handled */
    }
    setSaving(false)
  }, [box.id, form, onSuccess, onClose])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteBox(box.id)
      onDelete()
      onClose()
    } catch (err: unknown) {
      setDeleteError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '删除失败')
    }
    setDeleting(false)
  }, [box.id, onDelete, onClose])

  return (
    <Modal open={open} title="编辑冻存盒" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-lab-muted mb-1">名称</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-lab-muted mb-1">存放位置</label>
            <input type="text" value={form.storage_location} onChange={(e) => setForm({ ...form, storage_location: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-lab-muted mb-1">存放温度</label>
            <input type="text" value={form.storage_temperature} onChange={(e) => setForm({ ...form, storage_temperature: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button type="button" className="btn-danger" disabled={deleting} onClick={handleDelete}>{deleting ? '删除中...' : '删除'}</button>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="button" className="btn-primary" disabled={saving || !form.name} onClick={handleSave}>{saving ? '...' : '保存'}</button>
          </div>
        </div>
        {deleteError && <p className="text-xs text-lab-danger bg-lab-danger/10 rounded px-3 py-2">{deleteError}</p>}
      </div>
    </Modal>
  )
}
