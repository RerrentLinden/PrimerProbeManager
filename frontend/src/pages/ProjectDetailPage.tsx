import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchProject } from '@/api/projects'
import type { Project, ProjectGene } from '@/types'
import ProjectTubesTab from '@/components/Project/ProjectTubesTab'
import GenePanelTab from '@/components/Project/GenePanelTab'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

type TabKey = 'primers' | 'genes'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [project, setProject] = useState<Project | null>(null)
  const [projectPrimers, setProjectPrimers] = useState<{ id: number; name: string; type: string }[]>([])
  const [genes, setGenes] = useState<ProjectGene[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('primers')

  const loadData = useCallback(async () => {
    try {
      const { data } = await fetchProject(projectId)
      setProject(data)
      setProjectPrimers(data.primers ?? [])
      setGenes(data.genes ?? [])
    } catch { /* handled */ }
    setLoading(false)
  }, [projectId])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <LoadingSpinner size="lg" />
  if (!project) return <EmptyState title="项目不存在" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/projects" className="hover:text-blue-600">项目列表</Link>
        <span>/</span>
        <span className="text-slate-800">{project.name}</span>
      </div>

      <div className="card p-5">
        <h1 className="text-xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-slate-500 mt-1">{project.description}</p>
        )}
      </div>

      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="card p-5">
        {activeTab === 'primers' && (
          <ProjectTubesTab projectId={projectId} primers={projectPrimers} onRefresh={loadData} />
        )}
        {activeTab === 'genes' && (
          <GenePanelTab projectId={projectId} genes={genes} onRefresh={loadData} />
        )}
      </div>
    </div>
  )
}

function TabSwitcher({ activeTab, onTabChange }: {
  readonly activeTab: TabKey
  readonly onTabChange: (tab: TabKey) => void
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'primers', label: '引物探针' },
    { key: 'genes', label: '基因面板' },
  ]

  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
