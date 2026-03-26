import { useState, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { createProject } from '@/api/projects'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function CreateProjectModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createProject({ name, description: description || undefined })
      setName('')
      setDescription('')
      onSuccess()
      onClose()
    } catch { /* handled */ }
    setSubmitting(false)
  }, [name, description, onSuccess, onClose])

  return (
    <Modal open={open} title="新建项目" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">项目名称 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={!name.trim() || submitting} onClick={handleSubmit}>
            {submitting ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
