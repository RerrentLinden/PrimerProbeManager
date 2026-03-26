import { useCallback, useEffect, useState } from 'react'
import { deleteProject, updateProject } from '@/api/projects'
import type { Project } from '@/types'
import Modal from '@/components/common/Modal'

interface Props {
  readonly open: boolean
  readonly project: Project
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly onDelete: () => void
}

export default function EditProjectModal({
  open,
  project,
  onClose,
  onSuccess,
  onDelete,
}: Props) {
  const [form, setForm] = useState(toForm(project))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(toForm(project))
    setError('')
  }, [open, project])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '项目保存失败'))
    }
    setSaving(false)
  }, [form.description, form.name, onClose, onSuccess, project.id])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteProject(project.id)
      onDelete()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '项目删除失败'))
    }
    setDeleting(false)
  }, [onClose, onDelete, project.id])

  return (
    <>
      <Modal open={open} title="编辑项目" onClose={onClose}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1">项目名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
              rows={4}
            />
          </div>

          {error && <p className="text-xs text-lab-danger bg-lab-danger/10 rounded px-3 py-2">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="btn-danger"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? '删除中...' : '删除项目'}
            </button>

            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
              <button
                type="button"
                className="btn-primary"
                disabled={saving || !form.name.trim()}
                onClick={handleSave}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function toForm(project: Project) {
  return {
    name: project.name,
    description: project.description ?? '',
  }
}

function extractError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
}
