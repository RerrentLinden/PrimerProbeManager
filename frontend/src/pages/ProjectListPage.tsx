import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchProjects } from '@/api/projects'
import type { Project } from '@/types'
import SearchInput from '@/components/common/SearchInput'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">项目管理</h1>
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
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-slate-800">{p.name}</h3>
              {p.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              )}
              <div className="flex gap-4 mt-3 text-xs text-slate-400">
                <span>引物管: {p.primer_count ?? 0}</span>
                <span>基因: {p.gene_count ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={load} />
    </div>
  )
}
