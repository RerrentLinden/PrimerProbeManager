import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPrimer } from '@/api/primers'
import { fetchTubes } from '@/api/tubes'
import type { Primer, PrimerTube } from '@/types'
import PrimerInfoCard from '@/components/PrimerDetail/PrimerInfoCard'
import TubeCard from '@/components/PrimerDetail/TubeCard'
import RecordUsageModal from '@/components/PrimerDetail/RecordUsageModal'
import AddTubeModal from '@/components/PrimerDetail/AddTubeModal'
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
        <Link to="/primers" className="hover:text-blue-600">引物列表</Link>
        <span>/</span>
        <span className="text-slate-800">{primer.name}</span>
      </div>

      <PrimerInfoCard primer={primer} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">管列表 ({tubes.length})</h2>
        <button type="button" className="btn-primary text-sm" onClick={() => setShowAddTube(true)}>
          添加新管
        </button>
      </div>

      {tubes.length === 0 ? (
        <EmptyState title="暂无管" description="点击上方按钮添加" />
      ) : (
        <div className="space-y-3">
          {tubes.map((t) => (
            <TubeCard key={t.id} tube={t} onRecordUsage={setUsageTubeId} />
          ))}
        </div>
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
    </div>
  )
}
