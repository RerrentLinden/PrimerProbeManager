import { useState, useCallback } from 'react'
import type { Primer } from '@/types'
import { formatGcPercent } from '@/utils/format'

interface Props {
  readonly primer: Primer
  readonly onEdit?: () => void
}

export default function PrimerInfoCard({ primer, onEdit }: Props) {
  const [copied, setCopied] = useState(false)

  const copySequence = useCallback(async () => {
    await navigator.clipboard.writeText(primer.sequence)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [primer.sequence])

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{primer.name}</h1>
          <span className={primer.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
            {primer.type === 'probe' ? '探针' : '引物'}
          </span>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="btn-secondary text-xs py-1 px-2.5">编辑</button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">序列 (5' → 3')</label>
        <button
          type="button"
          onClick={copySequence}
          title="点击复制序列"
          className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 w-full text-left hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <code className="font-sequence text-sm text-slate-700 break-all flex-1">
            {primer.sequence}
          </code>
          <span className="shrink-0 text-slate-400">
            {copied ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      <InfoGrid primer={primer} />
    </div>
  )
}

function InfoGrid({ primer }: { readonly primer: Primer }) {
  const fields = [
    { label: '碱基数', value: primer.base_count },
    { label: "5'修饰", value: primer.modification_5prime ?? '-' },
    { label: "3'修饰", value: primer.modification_3prime ?? '-' },
    { label: 'MW', value: primer.mw?.toFixed(2) ?? '-' },
    { label: 'GC%', value: formatGcPercent(primer.gc_percent) },
    { label: 'Tm', value: primer.tm ? `${primer.tm.toFixed(1)}°C` : '-' },
    { label: '纯化方式', value: primer.purification_method ?? '-' },
    { label: 'ug/OD', value: primer.ug_per_od?.toFixed(2) ?? '-' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {fields.map((f) => (
        <div key={f.label}>
          <dt className="text-xs text-slate-500">{f.label}</dt>
          <dd className="text-sm font-medium text-slate-700 tabular-nums">{f.value}</dd>
        </div>
      ))}
    </div>
  )
}
