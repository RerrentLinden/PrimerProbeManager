import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPrimer } from '@/api/primers'
import { fetchTubes } from '@/api/tubes'
import { fetchProjects, addProjectPrimer, removeProjectPrimer, createProject } from '@/api/projects'
import type { Primer, PrimerTube, Project } from '@/types'
import PrimerInfoCard from '@/components/PrimerDetail/PrimerInfoCard'
import EditPrimerModal from '@/components/PrimerDetail/EditPrimerModal'
import TubeCard from '@/components/PrimerDetail/TubeCard'
import RecordUsageModal from '@/components/PrimerDetail/RecordUsageModal'
import AddTubeModal from '@/components/PrimerDetail/AddTubeModal'
import EditTubeModal from '@/components/PrimerDetail/EditTubeModal'
import MoveTargetModal from '@/components/Storage/MoveTargetModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export default function PrimerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const primerId = Number(id)
  const [primer, setPrimer] = useState<Primer | null>(null)
  const [tubes, setTubes] = useState<PrimerTube[]>([])
  const [loading, setLoading] = useState(true)
  const [usageTubeId, setUsageTubeId] = useState<number | null>(null)
  const [showAddTube, setShowAddTube] = useState(false)
  const [showEditPrimer, setShowEditPrimer] = useState(false)
  const [editTubeId, setEditTubeId] = useState<number | null>(null)
  const [assignTubeId, setAssignTubeId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [primerRes, tubesRes] = await Promise.all([
        fetchPrimer(primerId),
        fetchTubes(primerId),
      ])
      setPrimer(primerRes.data)
      setTubes(tubesRes.data)
    } catch { /* handled by interceptor */ }
    setLoading(false)
  }, [primerId])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <LoadingSpinner size="lg" />
  if (!primer) return <EmptyState title="引物不存在" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/primers" className="hover:text-blue-600">引探管理</Link>
        <span>/</span>
        <span className="text-slate-800">{primer.name}</span>
      </div>

      <PrimerInfoCard primer={primer} onEdit={() => setShowEditPrimer(true)} />

      <ProjectSection primerId={primerId} projects={primer.projects ?? []} onRefresh={loadData} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">分管列表 ({tubes.length})</h2>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowAddTube(true)}>
          添加新管
        </button>
      </div>

      {tubes.length === 0 ? (
        <EmptyState title="暂无管" description="点击上方按钮添加" />
      ) : (
        <div className="space-y-3">
          {tubes.map((t) => (
            <TubeCard
              key={t.id}
              tube={t}
              onRecordUsage={setUsageTubeId}
              onEdit={setEditTubeId}
              onAssignPosition={setAssignTubeId}
              onArchived={loadData}
            />
          ))}
        </div>
      )}

      {primer && (
        <EditPrimerModal
          open={showEditPrimer}
          primer={primer}
          onClose={() => setShowEditPrimer(false)}
          onSuccess={loadData}
        />
      )}

      <RecordUsageModal
        open={usageTubeId !== null}
        tubeId={usageTubeId}
        onClose={() => setUsageTubeId(null)}
        onSuccess={loadData}
      />

      <AddTubeModal
        open={showAddTube}
        primerId={primerId}
        onClose={() => setShowAddTube(false)}
        onSuccess={loadData}
      />

      <EditTubeModal
        open={editTubeId !== null}
        tube={tubes.find((t) => t.id === editTubeId) ?? null}
        onClose={() => setEditTubeId(null)}
        onSuccess={loadData}
      />

      <MoveTargetModal
        open={assignTubeId !== null}
        tubeId={assignTubeId}
        onClose={() => setAssignTubeId(null)}
        onSuccess={loadData}
      />
    </div>
  )
}


function ProjectSection({ primerId, projects, onRefresh }: {
  readonly primerId: number
  readonly projects: { id: number; name: string }[]
  readonly onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (editing) {
      fetchProjects().then(({ data }) => setAllProjects(data)).catch(() => {})
    }
  }, [editing])

  const linkedIds = new Set(projects.map((p) => p.id))
  const available = allProjects.filter((p) => !linkedIds.has(p.id))

  const handleAdd = useCallback(async (projectId: number) => {
    await addProjectPrimer(projectId, primerId)
    onRefresh()
  }, [primerId, onRefresh])

  const handleRemove = useCallback(async (projectId: number) => {
    await removeProjectPrimer(projectId, primerId)
    onRefresh()
  }, [primerId, onRefresh])

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await createProject({ name: newName.trim() })
      await addProjectPrimer(data.id, primerId)
      setNewName('')
      onRefresh()
    } catch { /* handled */ }
    setCreating(false)
  }, [newName, primerId, onRefresh])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-500">归属项目</h3>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="btn-secondary text-xs py-1 px-2.5"
        >
          {editing ? '完成' : '编辑'}
        </button>
      </div>

      {projects.length === 0 && !editing && (
        <p className="text-sm text-slate-400">未归属任何项目</p>
      )}

      <div className="flex flex-wrap gap-2">
        {projects.map((proj) => (
          <span
            key={proj.id}
            className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg"
          >
            <Link to={`/projects/${proj.id}`} className="hover:underline">{proj.name}</Link>
            {editing && (
              <button type="button" onClick={() => handleRemove(proj.id)} className="text-blue-400 hover:text-red-500 ml-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {available.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAdd(p.id)}
                  className="text-xs border border-dashed border-slate-300 text-slate-500 px-2.5 py-1 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="新建项目名称..."
              className="input-field text-xs flex-1"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="btn-primary text-xs py-1.5 px-3 shrink-0"
            >
              {creating ? '...' : '新建并关联'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
