import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchProject } from '@/api/projects'
import type { Project, ProjectGene } from '@/types'
import ProjectTubesTab from '@/components/Project/ProjectTubesTab'
import GenePanelTab from '@/components/Project/GenePanelTab'
import EditProjectModal from '@/components/Project/EditProjectModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

type TabKey = 'primers' | 'genes'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)
  const [project, setProject] = useState<Project | null>(null)
  const [projectPrimers, setProjectPrimers] = useState<NonNullable<Project['primers']>>([])
  const [genes, setGenes] = useState<ProjectGene[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('primers')
  const [showEdit, setShowEdit] = useState(false)

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
      <div className="flex items-center gap-2 text-sm text-lab-muted">
        <Link to="/projects" className="hover:text-lab-accent">项目管理</Link>
        <span>/</span>
        <span className="text-lab-text">{project.name}</span>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-lab-text">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-lab-muted mt-1">{project.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-lab-bg px-2.5 py-1 text-xs font-medium text-lab-muted">
                关联引探 {project.primer_count ?? projectPrimers.length}
              </span>
              <span className="inline-flex items-center rounded-full bg-lab-bg px-2.5 py-1 text-xs font-medium text-lab-muted">
                关联基因 {project.gene_count ?? genes.length}
              </span>
            </div>
          </div>

          <button type="button" className="btn-secondary text-sm shrink-0" onClick={() => setShowEdit(true)}>
            编辑
          </button>
        </div>
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

      <EditProjectModal
        open={showEdit}
        project={project}
        onClose={() => setShowEdit(false)}
        onSuccess={loadData}
        onDelete={() => navigate('/projects', { replace: true })}
      />
    </div>
  )
}

function TabSwitcher({ activeTab, onTabChange }: {
  readonly activeTab: TabKey
  readonly onTabChange: (tab: TabKey) => void
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'primers', label: '关联引探' },
    { key: 'genes', label: '基因面板' },
  ]

  return (
    <div className="flex gap-1 bg-lab-bg rounded-lg p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-lab-raised text-lab-text shadow-raised'
              : 'text-lab-muted hover:text-lab-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
