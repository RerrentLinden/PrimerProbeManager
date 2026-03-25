import { useState, useCallback, useEffect } from 'react'
import type { PrimerTube, Primer } from '@/types'
import { addProjectPrimer, removeProjectPrimer } from '@/api/projects'
import { fetchPrimers } from '@/api/primers'
import { fetchTubes } from '@/api/tubes'
import VolumeBar from '@/components/common/VolumeBar'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'

interface Props {
  readonly projectId: number
  readonly tubes: PrimerTube[]
  readonly onRefresh: () => void
}

export default function ProjectTubesTab({ projectId, tubes, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  const handleRemove = useCallback(async (tubeId: number) => {
    await removeProjectPrimer(projectId, tubeId)
    onRefresh()
  }, [projectId, onRefresh])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">关联引物管 ({tubes.length})</h3>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowAdd(true)}>
          添加管
        </button>
      </div>

      {tubes.length === 0 ? (
        <EmptyState title="暂无关联管" description="点击添加管按钮关联引物管" />
      ) : (
        <div className="space-y-2">
          {tubes.map((t) => (
            <div key={t.id} className="card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{t.primer_name}</span>
                <span className="text-xs text-slate-500 ml-2">{t.batch_number}</span>
              </div>
              <div className="w-32">
                <VolumeBar remaining={t.remaining_volume_ul} initial={t.initial_volume_ul} />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(t.id)}
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

      <AddTubeToProjectModal
        open={showAdd}
        projectId={projectId}
        onClose={() => setShowAdd(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}

function AddTubeToProjectModal({ open, projectId, onClose, onSuccess }: {
  readonly open: boolean
  readonly projectId: number
  readonly onClose: () => void
  readonly onSuccess: () => void
}) {
  const [search, setSearch] = useState('')
  const [primers, setPrimers] = useState<Primer[]>([])
  const [selectedPrimerId, setSelectedPrimerId] = useState<number | null>(null)
  const [tubes, setTubes] = useState<PrimerTube[]>([])

  useEffect(() => {
    if (!open) return
    fetchPrimers({ search: search || undefined, page_size: 50 })
      .then(({ data }) => setPrimers(data.items))
      .catch(() => {})
  }, [open, search])

  useEffect(() => {
    if (!selectedPrimerId) { setTubes([]); return }
    fetchTubes(selectedPrimerId, 'active')
      .then(({ data }) => setTubes(data))
      .catch(() => {})
  }, [selectedPrimerId])

  const handleSelect = useCallback(async (tubeId: number) => {
    await addProjectPrimer(projectId, tubeId)
    onSuccess()
    onClose()
  }, [projectId, onSuccess, onClose])

  return (
    <Modal open={open} title="添加引物管到项目" onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedPrimerId(null) }}
          placeholder="搜索引物..."
          className="input-field"
        />
        {!selectedPrimerId && primers.map((p) => (
          <button key={p.id} type="button" onClick={() => setSelectedPrimerId(p.id)} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-sm">
            {p.name}
          </button>
        ))}
        {selectedPrimerId && tubes.map((t) => (
          <button key={t.id} type="button" onClick={() => handleSelect(t.id)} className="w-full card p-2 text-left hover:border-blue-300 text-sm">
            {t.batch_number} — {t.remaining_volume_ul} uL
          </button>
        ))}
      </div>
    </Modal>
  )
}
