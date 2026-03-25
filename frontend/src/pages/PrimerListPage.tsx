import { useState, useEffect, useCallback } from 'react'
import { fetchPrimers } from '@/api/primers'
import { fetchStats, fetchLowVolumeAlerts } from '@/api/stats'
import type { Primer, Stats, LowVolumeAlert } from '@/types'
import { PAGE_SIZE } from '@/utils/constants'
import StatCards from '@/components/PrimerList/StatCards'
import PrimerTable from '@/components/PrimerList/PrimerTable'
import PrimerCardList from '@/components/PrimerList/PrimerCardList'
import AlertDrawer from '@/components/PrimerList/AlertDrawer'
import TypeFilter from '@/components/PrimerList/TypeFilter'
import SearchInput from '@/components/common/SearchInput'
import EmptyState from '@/components/common/EmptyState'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function PrimerListPage() {
  const [primers, setPrimers] = useState<Primer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [alerts, setAlerts] = useState<LowVolumeAlert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPrimers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await fetchPrimers({
        search: search || undefined,
        type: (typeFilter as 'primer' | 'probe') || undefined,
        page,
        page_size: PAGE_SIZE,
      })
      setPrimers(data.items)
      setTotal(data.total)
    } catch { /* handled by interceptor */ }
    setLoading(false)
  }, [search, typeFilter, page])

  useEffect(() => { loadPrimers() }, [loadPrimers])

  useEffect(() => {
    fetchStats().then(({ data }) => setStats(data)).catch(() => {})
    fetchLowVolumeAlerts().then(({ data }) => setAlerts(data)).catch(() => {})
  }, [])

  const handleSearch = useCallback((q: string) => {
    setSearch(q)
    setPage(1)
  }, [])

  const handleTypeChange = useCallback((t: string) => {
    setTypeFilter(t)
    setPage(1)
  }, [])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <StatCards stats={stats} onAlertClick={() => setShowAlerts(true)} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="搜索引物名称或序列..." onSearch={handleSearch} className="flex-1" />
        <TypeFilter value={typeFilter} onChange={handleTypeChange} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : primers.length === 0 ? (
        <EmptyState title="暂无引物" description="导入或创建引物后会显示在这里" />
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

function Pagination({ page, totalPages, onPageChange }: {
  readonly page: number
  readonly totalPages: number
  readonly onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn-secondary text-xs px-3 py-1"
      >
        上一页
      </button>
      <span className="text-sm text-slate-500">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="btn-secondary text-xs px-3 py-1"
      >
        下一页
      </button>
    </div>
  )
}
