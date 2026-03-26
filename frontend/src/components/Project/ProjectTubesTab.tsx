import { useState, useCallback, useEffect } from 'react'
import type { Primer, ProjectPrimer } from '@/types'
import { addProjectPrimer, removeProjectPrimer } from '@/api/projects'
import { fetchPrimers } from '@/api/primers'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import ProjectPrimerOverview from '@/components/Project/ProjectPrimerOverview'

interface Props {
  readonly projectId: number
  readonly primers: ProjectPrimer[]
  readonly onRefresh: () => void
}

export default function ProjectTubesTab({ projectId, primers, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const handleRemove = useCallback(async (primerId: number) => {
    setRemovingId(primerId)
    setActionError('')
    try {
      await removeProjectPrimer(projectId, primerId)
      onRefresh()
    } catch (err: unknown) {
      setActionError(extractError(err, '移除关联引探失败'))
    }
    setRemovingId(null)
  }, [projectId, onRefresh])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">关联引探 ({primers.length})</h3>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowAdd(true)}>
          添加引探
        </button>
      </div>

      {actionError && <p className="mb-4 text-xs text-lab-danger bg-lab-danger/10 rounded px-3 py-2">{actionError}</p>}

      {primers.length === 0 ? (
        <EmptyState title="暂无关联引探" description="点击添加引探按钮关联" />
      ) : (
        <ProjectPrimerOverview
          primers={primers}
          removingId={removingId}
          onRemove={handleRemove}
          onRefresh={onRefresh}
        />
      )}

      <AddPrimerToProjectModal
        open={showAdd}
        projectId={projectId}
        existingIds={primers.map((p) => p.id)}
        onClose={() => setShowAdd(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}

function AddPrimerToProjectModal({ open, projectId, existingIds, onClose, onSuccess }: {
  readonly open: boolean
  readonly projectId: number
  readonly existingIds: number[]
  readonly onClose: () => void
  readonly onSuccess: () => void
}) {
  const [search, setSearch] = useState('')
  const [primers, setPrimers] = useState<Primer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    fetchPrimers({ search: search || undefined, page_size: 50 })
      .then(({ data }) => setPrimers(data.items.filter((p) => !existingIds.includes(p.id))))
      .catch((err: unknown) => setError(extractError(err, '引探列表加载失败')))
      .finally(() => setLoading(false))
  }, [open, search, existingIds])

  const handleSelect = useCallback(async (primerId: number) => {
    setError('')
    try {
      await addProjectPrimer(projectId, primerId)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '添加引探失败'))
    }
  }, [projectId, onSuccess, onClose])

  return (
    <Modal open={open} title="添加引探到项目" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索引探..."
          className="input-field"
        />
        {error && <p className="text-xs text-lab-danger bg-lab-danger/10 rounded px-3 py-2">{error}</p>}
        {loading && <p className="text-sm text-lab-muted text-center py-4">加载中...</p>}
        {!loading && primers.length === 0 && <p className="text-sm text-lab-muted text-center py-4">无可添加的引探</p>}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {primers.map((p) => (
            <button key={p.id} type="button" onClick={() => handleSelect(p.id)} className="w-full card p-2 text-left hover:border-lab-accent/50 text-sm flex items-center gap-2">
              <span className="font-medium">{p.name}</span>
              <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                {p.type === 'probe' ? '探针' : '引物'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

function extractError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
}
