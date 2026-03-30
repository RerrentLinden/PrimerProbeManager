import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchProjects, reorderProjects, moveProjectSortOrder } from '@/api/projects'
import type { Project } from '@/types'
import { useDragReorder } from '@/hooks/useDragReorder'
import SearchInput from '@/components/common/SearchInput'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DragGhost from '@/components/common/DragGhost'
import SortOrderBadge from '@/components/common/SortOrderBadge'
import CreateProjectModal from '@/components/Project/CreateProjectModal'

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await fetchProjects(search || undefined)
      setProjects(data)
    } catch { /* handled */ }
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const reorder = useDragReorder({
    items: projects,
    getId: p => p.id,
    getLabel: p => p.name,
    onReorder: async (ids) => { await reorderProjects(ids); await load() },
    horizontal: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-lab-text">项目管理</h1>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
          新建项目
        </button>
      </div>

      <SearchInput placeholder="搜索项目..." onSearch={setSearch} />

      {loading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <EmptyState title="暂无项目" description="点击右上方创建第一个项目" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reorder.items.map((p) => (
            <div key={p.id} {...reorder.getItemProps(p.id)} className="relative select-none touch-none">
              {reorder.insertionAt(p.id) === 'before' && (
                <div className="absolute -left-[3px] top-0 bottom-0 w-[3px] rounded bg-lab-accent" />
              )}
              <Link
                to={`/projects/${p.id}`}
                draggable={false}
                className={`card p-4 hover:border-lab-accent/40 transition-colors block${reorder.isDragSource(p.id) ? ' opacity-40' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <SortOrderBadge
                    value={p.sort_order}
                    onCommit={(n) => moveProjectSortOrder(p.id, n).then(() => load())}
                  />
                  <h3 className="font-semibold text-lab-text">{p.name}</h3>
                </div>
                {p.description && (
                  <p className="text-sm text-lab-muted mt-1 line-clamp-2">{p.description}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-lab-muted">
                  <span>引探: {p.primer_count ?? 0}</span>
                  <span>基因: {p.gene_count ?? 0}</span>
                </div>
              </Link>
              {reorder.insertionAt(p.id) === 'after' && (
                <div className="absolute -right-[3px] top-0 bottom-0 w-[3px] rounded bg-lab-accent" />
              )}
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={load} />
      {reorder.drag && <DragGhost label={reorder.drag.label} x={reorder.drag.x} y={reorder.drag.y} />}
    </div>
  )
}
