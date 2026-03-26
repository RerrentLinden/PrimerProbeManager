import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Primer } from '@/types'
import { truncateSequence, formatGcPercent } from '@/utils/format'

interface Props {
  readonly primers: Primer[]
}

export default function PrimerCardList({ primers }: Props) {
  return (
    <div className="md:hidden space-y-3">
      {primers.map((p) => (
        <Link key={p.id} to={`/primers/${p.id}`} className="card p-4 block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-lab-text">{p.name}</span>
            <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
              {p.type === 'probe' ? '探针' : '引物'}
            </span>
          </div>
          <CopyableSequence sequence={p.sequence} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-lab-muted">
            <span>MW: {p.mw?.toFixed(1) ?? '-'}</span>
            <span>Tm: {p.tm?.toFixed(1) ?? '-'}</span>
            <span>GC: {formatGcPercent(p.gc_percent)}</span>
            <span>管数: {p.active_tube_count ?? 0}</span>
          </div>
          <ProjectTags projects={p.projects} />
        </Link>
      ))}
    </div>
  )
}

function ProjectTags({ projects }: { readonly projects?: { id: number; name: string }[] }) {
  const navigate = useNavigate()
  if (!projects || projects.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {projects.map((proj) => (
        <button
          key={proj.id}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${proj.id}`) }}
          className="text-xs bg-lab-raised text-lab-muted px-1.5 py-0.5 rounded hover:bg-lab-accent/10 hover:text-lab-accent transition-colors"
        >
          {proj.name}
        </button>
      ))}
    </div>
  )
}

function CopyableSequence({ sequence }: { readonly sequence: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(sequence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [sequence])

  return (
    <button
      type="button"
      onClick={handleClick}
      title="点击复制序列"
      className="font-sequence text-xs text-lab-muted mb-2 truncate block hover:text-lab-accent cursor-pointer transition-colors"
    >
      {copied ? <span className="text-lab-success">已复制 ✓</span> : truncateSequence(sequence)}
    </button>
  )
}
