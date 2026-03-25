import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Primer } from '@/types'
import { addProjectPrimer, removeProjectPrimer } from '@/api/projects'
import { fetchPrimers } from '@/api/primers'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'

interface PrimerInfo {
  readonly id: number
  readonly name: string
  readonly type: string
}

interface Props {
  readonly projectId: number
  readonly primers: PrimerInfo[]
  readonly onRefresh: () => void
}

export default function ProjectTubesTab({ projectId, primers, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  const handleRemove = useCallback(async (primerId: number) => {
    await removeProjectPrimer(projectId, primerId)
    onRefresh()
  }, [projectId, onRefresh])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">关联引物探针 ({primers.length})</h3>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowAdd(true)}>
          添加引物
        </button>
      </div>

      {primers.length === 0 ? (
        <EmptyState title="暂无关联引物" description="点击添加引物按钮关联" />
      ) : (
        <div className="space-y-2">
          {primers.map((p) => (
            <div key={p.id} className="card p-3 flex items-center gap-3">
              <Link to={`/primers/${p.id}`} className="flex-1 min-w-0">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-800">{p.name}</span>
              </Link>
              <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                {p.type === 'probe' ? '探针' : '引物'}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
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

  useEffect(() => {
    if (!open) return
    fetchPrimers({ search: search || undefined, page_size: 50 })
      .then(({ data }) => setPrimers(data.items.filter((p) => !existingIds.includes(p.id))))
      .catch(() => {})
  }, [open, search, existingIds])

  const handleSelect = useCallback(async (primerId: number) => {
    await addProjectPrimer(projectId, primerId)
    onSuccess()
    onClose()
  }, [projectId, onSuccess, onClose])

  return (
    <Modal open={open} title="添加引物到项目" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索引物..."
          className="input-field"
        />
        {primers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">无可添加的引物</p>}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {primers.map((p) => (
            <button key={p.id} type="button" onClick={() => handleSelect(p.id)} className="w-full card p-2 text-left hover:border-blue-300 text-sm flex items-center gap-2">
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
