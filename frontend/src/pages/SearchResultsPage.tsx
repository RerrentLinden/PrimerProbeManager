import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { globalSearch } from '@/api/search'
import type { SearchResults } from '@/types/search'
import { positionLabel } from '@/utils/format'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(query)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const { data } = await globalSearch(q)
      setResults(data)
    } catch { /* handled */ }
    setLoading(false)
  }, [])

  useEffect(() => { if (query) doSearch(query) }, [query, doSearch])
  useEffect(() => { setInputValue(query) }, [query])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (inputValue.trim()) {
        setSearchParams({ q: inputValue.trim() })
      }
    },
    [inputValue, setSearchParams],
  )

  const handleTubeClick = useCallback(
    (boxId: number | undefined, primerId: number, highlight: string) => {
      if (boxId) {
        navigate(`/storage?box=${boxId}&highlight=${encodeURIComponent(highlight)}`)
        return
      }
      navigate(`/primers/${primerId}`)
    },
    [navigate],
  )

  const total = results
    ? results.primers.length + results.tubes.length + results.boxes.length + results.projects.length
    : 0

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="搜索引探、分管、冻存盒、项目..."
          className="input-field text-lg"
          autoFocus
        />
      </form>

      {loading && <LoadingSpinner />}

      {results && !loading && total === 0 && (
        <EmptyState title="未找到结果" description={`"${query}" 没有匹配的内容`} />
      )}

      {results && !loading && total > 0 && (
        <div className="space-y-6">
          <PrimerResults primers={results.primers} />
          <TubeResults tubes={results.tubes} onTubeClick={handleTubeClick} />
          <BoxResults boxes={results.boxes} />
          <ProjectResults projects={results.projects} />
        </div>
      )}
    </div>
  )
}

function PrimerResults({ primers }: { readonly primers: SearchResults['primers'] }) {
  if (primers.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">引探 ({primers.length})</h3>
      <div className="space-y-2">
        {primers.map((p) => (
          <Link key={p.id} to={`/primers/${p.id}`} className="card p-3 block hover:border-blue-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-800">{p.name}</span>
              <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                {p.type === 'probe' ? '探针' : '引物'}
              </span>
              <InlineMetaPill label="MW" value={displayValue(p.mw)} />
              <InlineMetaPill label="5'" value={displayValue(p.modification_5prime)} />
              <InlineMetaPill label="3'" value={displayValue(p.modification_3prime)} />
              <InlineMetaPill label="项目" value={formatProjectNames(p.projects)} />
            </div>
            <p className="mt-2 font-sequence text-xs text-slate-600 break-all">{p.sequence}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TubeResults({ tubes, onTubeClick }: {
  readonly tubes: SearchResults['tubes']
  readonly onTubeClick: (boxId: number | undefined, primerId: number, highlight: string) => void
}) {
  if (tubes.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">分管 ({tubes.length})</h3>
      <div className="space-y-2">
        {tubes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTubeClick(t.position?.box_id, t.primer_id, t.batch_number || t.primer_name)}
            className="card p-3 w-full text-left hover:border-blue-300"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-800">{t.primer_name}</span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                批号 {formatTubeLabel(t.batch_number, t.tube_number)}
              </span>
            </div>
            {t.position && (
              <p className="mt-2 text-xs text-slate-500">
                {t.position.box_name} {positionLabel(t.position.row, t.position.col)}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

function BoxResults({ boxes }: { readonly boxes: SearchResults['boxes'] }) {
  if (boxes.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">冻存盒 ({boxes.length})</h3>
      <div className="space-y-2">
        {boxes.map((b) => (
          <Link key={b.id} to={`/storage?box=${b.id}`} className="card p-3 block hover:border-blue-300">
            <span className="font-medium text-slate-800">{b.name}</span>
            <p className="mt-2 text-xs text-slate-500">
              存放位置 {displayValue(b.storage_location)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProjectResults({ projects }: { readonly projects: SearchResults['projects'] }) {
  if (projects.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">项目 ({projects.length})</h3>
      <div className="space-y-2">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="card p-3 block hover:border-blue-300">
            <span className="font-medium text-slate-800">{project.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function InlineMetaPill({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
      <span className="text-slate-400">{label}</span>
      <span className="truncate max-w-[22rem]">{value}</span>
    </span>
  )
}

function displayValue(value: number | string | null): string {
  if (value === null || value === '') return '-'
  return String(value)
}

function formatProjectNames(projects: SearchResults['primers'][number]['projects']): string {
  if (projects.length === 0) return '-'
  return projects.map((project) => project.name).join('、')
}

function formatTubeLabel(batchNumber: string, tubeNumber: string | null): string {
  return tubeNumber ? `${batchNumber} #${tubeNumber}` : batchNumber
}
