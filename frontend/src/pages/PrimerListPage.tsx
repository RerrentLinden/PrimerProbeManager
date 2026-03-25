import { useState, useEffect, useCallback } from 'react'
import { fetchPrimers, fetchModifications } from '@/api/primers'
import { fetchStats, fetchLowVolumeAlerts } from '@/api/stats'
import { fetchProjects } from '@/api/projects'
import type { Primer, Stats, LowVolumeAlert, Project } from '@/types'
import { PAGE_SIZE } from '@/utils/constants'
import { useDebounce } from '@/hooks/useDebounce'
import StatCards from '@/components/PrimerList/StatCards'
import PrimerTable from '@/components/PrimerList/PrimerTable'
import PrimerCardList from '@/components/PrimerList/PrimerCardList'
import AlertDrawer from '@/components/PrimerList/AlertDrawer'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const NONE_VALUE = '__none__'

export default function PrimerListPage() {
  const [primers, setPrimers] = useState<Primer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [alerts, setAlerts] = useState<LowVolumeAlert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [mod5Filter, setMod5Filter] = useState('')
  const [mod3Filter, setMod3Filter] = useState('')
  const [projectFilter, setProjectFilter] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [mod5Options, setMod5Options] = useState<string[]>([])
  const [mod3Options, setMod3Options] = useState<string[]>([])
  const [projectOptions, setProjectOptions] = useState<Project[]>([])

  useEffect(() => {
    fetchStats().then(({ data }) => setStats(data)).catch(() => {})
    fetchLowVolumeAlerts().then(({ data }) => setAlerts(data)).catch(() => {})
    fetchModifications().then(({ data }) => {
      setMod5Options(data.five_prime)
      setMod3Options(data.three_prime)
    }).catch(() => {})
    fetchProjects().then(({ data }) => setProjectOptions(data)).catch(() => {})
  }, [])

  const debouncedSearch = useDebounce(search)

  const loadPrimers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await fetchPrimers({
        page,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        type: (typeFilter as 'primer' | 'probe') || undefined,
        mod_5: mod5Filter || undefined,
        mod_3: mod3Filter || undefined,
        project_id: projectFilter ? (projectFilter as number) : undefined,
      })
      setPrimers(data.items)
      setTotal(data.total)
    } catch { /* handled */ }
    setLoading(false)
  }, [debouncedSearch, typeFilter, mod5Filter, mod3Filter, projectFilter, page])

  useEffect(() => { loadPrimers() }, [loadPrimers])

  const resetPage = useCallback(() => setPage(1), [])
  const hasFilters = typeFilter || mod5Filter || mod3Filter || projectFilter
  const hasSearchContext = Boolean(debouncedSearch || hasFilters)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <StatCards stats={stats} onAlertClick={() => setShowAlerts(true)} />

      {/* Filter bar + search */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect label="类型" value={typeFilter} options={[{ value: 'primer', label: '引物' }, { value: 'probe', label: '探针' }]} onChange={(v) => { setTypeFilter(v); resetPage() }} />
        <FilterSelect label="5'修饰" value={mod5Filter} options={[{ value: NONE_VALUE, label: '无修饰' }, ...mod5Options.map((m) => ({ value: m, label: m }))]} onChange={(v) => { setMod5Filter(v); resetPage() }} />
        <FilterSelect label="3'修饰" value={mod3Filter} options={[{ value: NONE_VALUE, label: '无修饰' }, ...mod3Options.map((m) => ({ value: m, label: m }))]} onChange={(v) => { setMod3Filter(v); resetPage() }} />
        <FilterSelect label="项目" value={projectFilter === '' ? '' : String(projectFilter)} options={projectOptions.map((p) => ({ value: String(p.id), label: p.name }))} onChange={(v) => { setProjectFilter(v ? Number(v) : ''); resetPage() }} />
        {hasFilters && (
          <button type="button" className="text-xs text-slate-400 hover:text-red-500 px-2" onClick={() => { setTypeFilter(''); setMod5Filter(''); setMod3Filter(''); setProjectFilter(''); resetPage() }}>
            清除
          </button>
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage() }}
          placeholder="搜索名称、序列、修饰、项目..."
          className="input-field flex-1 min-w-[200px]"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : primers.length === 0 ? (
        <EmptyState
          title={hasSearchContext ? '未找到匹配引物' : '暂无引物'}
          description={hasSearchContext ? '调整关键词或筛选条件后再试' : '导入或创建引物后会显示在这里'}
        />
      ) : (
        <>
          <PrimerTable primers={primers} />
          <PrimerCardList primers={primers} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <AlertDrawer open={showAlerts} alerts={alerts} onClose={() => setShowAlerts(false)} />
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }: {
  readonly label: string; readonly value: string; readonly options: { value: string; label: string }[]; readonly onChange: (v: string) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`input-field text-xs w-auto pr-7 ${value ? 'border-blue-400 bg-blue-50' : ''}`}>
      <option value="">{label}: 全部</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Pagination({ page, totalPages, onPageChange }: { readonly page: number; readonly totalPages: number; readonly onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn-secondary text-xs px-3 py-1">上一页</button>
      <span className="text-sm text-slate-500">{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn-secondary text-xs px-3 py-1">下一页</button>
    </div>
  )
}
