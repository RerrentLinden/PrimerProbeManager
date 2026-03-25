import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { globalSearch } from '@/api/search'
import type { SearchResults } from '@/types'
import { truncateSequence, positionLabel } from '@/utils/format'
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
    (boxId: number | undefined, highlight: string) => {
      if (boxId) {
        navigate(`/storage?box=${boxId}&highlight=${encodeURIComponent(highlight)}`)
      }
    },
    [navigate],
  )

  const total = results
    ? results.primers.length + results.tubes.length + results.boxes.length
    : 0

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="搜索引物、管或盒子..."
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
        </div>
      )}
    </div>
  )
}

function PrimerResults({ primers }: { readonly primers: SearchResults['primers'] }) {
  if (primers.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">引物 ({primers.length})</h3>
      <div className="space-y-2">
        {primers.map((p) => (
          <Link key={p.id} to={`/primers/${p.id}`} className="card p-3 block hover:border-blue-300">
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.name}</span>
              <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                {p.type === 'probe' ? '探针' : '引物'}
              </span>
            </div>
            <p className="font-sequence text-xs text-slate-500 mt-1">{truncateSequence(p.sequence)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TubeResults({ tubes, onTubeClick }: {
  readonly tubes: SearchResults['tubes']
  readonly onTubeClick: (boxId: number | undefined, highlight: string) => void
}) {
  if (tubes.length === 0) return null
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">管 ({tubes.length})</h3>
      <div className="space-y-2">
        {tubes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTubeClick(t.position?.box_id, t.batch_number || t.primer_name || '')}
            className="card p-3 w-full text-left hover:border-blue-300"
          >
            <span className="font-medium">{t.primer_name}</span>
            <span className="text-xs text-slate-500 ml-2">{t.batch_number}</span>
            {t.position && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-2">
                {t.position.box_name} {positionLabel(t.position.row, t.position.col)}
              </span>
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
      <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">盒子 ({boxes.length})</h3>
      <div className="space-y-2">
        {boxes.map((b) => (
          <Link key={b.id} to={`/storage?box=${b.id}`} className="card p-3 block hover:border-blue-300">
            <span className="font-medium">{b.name}</span>
            <span className="text-xs text-slate-500 ml-2">
              {b.storage_location} {b.storage_temperature}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
