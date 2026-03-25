import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { placePosition } from '@/api/boxes'
import { fetchPrimers } from '@/api/primers'
import { fetchTubes } from '@/api/tubes'
import type { Primer, PrimerTube } from '@/types'
import { positionLabel } from '@/utils/format'

interface Props {
  readonly open: boolean
  readonly boxId: number
  readonly row: number
  readonly col: number
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function PlaceTubeModal({ open, boxId, row, col, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('')
  const [primers, setPrimers] = useState<Primer[]>([])
  const [tubes, setTubes] = useState<PrimerTube[]>([])
  const [selectedPrimerId, setSelectedPrimerId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchPrimers({ search: search || undefined, page_size: 50 })
      .then(({ data }) => setPrimers(data.items))
      .catch(() => {})
  }, [open, search])

  useEffect(() => {
    if (!selectedPrimerId) { setTubes([]); return }
    fetchTubes(selectedPrimerId, 'active')
      .then(({ data }) => setTubes(data.filter((t) => !t.position)))
      .catch(() => {})
  }, [selectedPrimerId])

  const handlePlace = useCallback(async (tubeId: number) => {
    setSubmitting(true)
    try {
      await placePosition(boxId, row, col, tubeId)
      onSuccess()
      onClose()
    } catch { /* handled */ }
    setSubmitting(false)
  }, [boxId, row, col, onSuccess, onClose])

  return (
    <Modal open={open} title={`放置引物管 - ${positionLabel(row, col)}`} onClose={onClose}>
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedPrimerId(null) }}
          placeholder="搜索引物..."
          className="input-field"
        />

        {!selectedPrimerId && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {primers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPrimerId(p.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className={`ml-2 ${p.type === 'probe' ? 'badge-probe' : 'badge-primer'}`}>
                  {p.type === 'probe' ? '探针' : '引物'}
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedPrimerId && tubes.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">该引物无可用的未放置管</p>
        )}

        {selectedPrimerId && tubes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">选择管:</p>
            {tubes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handlePlace(t.id)}
                disabled={submitting}
                className="w-full card p-3 text-left hover:border-blue-300"
              >
                <span className="text-sm font-medium">{t.batch_number}</span>
                <span className="text-xs text-slate-500 ml-2">{t.remaining_volume_ul} uL</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
