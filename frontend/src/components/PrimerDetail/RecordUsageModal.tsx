import { useState, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { createUsageLog } from '@/api/tubes'
import { fetchProjects } from '@/api/projects'
import type { Project } from '@/types'
import { useEffect } from 'react'

interface Props {
  readonly open: boolean
  readonly tubeId: number | null
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function RecordUsageModal({ open, tubeId, onClose, onSuccess }: Props) {
  const [volume, setVolume] = useState('')
  const [purpose, setPurpose] = useState('')
  const [project, setProject] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchProjects().then(({ data }) => setProjects(data)).catch(() => {})
    }
  }, [open])

  const handleSubmit = useCallback(async () => {
    if (!tubeId || !volume) return
    setSubmitting(true)
    try {
      await createUsageLog(tubeId, {
        volume_used_ul: parseFloat(volume),
        purpose: purpose || undefined,
        project: project || undefined,
      })
      setVolume('')
      setPurpose('')
      setProject('')
      onSuccess()
      onClose()
    } catch { /* handled by interceptor */ }
    setSubmitting(false)
  }, [tubeId, volume, purpose, project, onSuccess, onClose])

  return (
    <Modal open={open} title="记录用量" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">用量 (uL) *</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="input-field"
            placeholder="输入用量"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">用途</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="input-field"
            placeholder="如: qPCR, 测序..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">项目</label>
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            list="project-list"
            className="input-field"
            placeholder="选择或输入项目名"
          />
          <datalist id="project-list">
            {projects.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!volume || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '提交中...' : '确认'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
