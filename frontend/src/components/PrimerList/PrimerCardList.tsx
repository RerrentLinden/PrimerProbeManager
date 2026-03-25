import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
            <span className="font-medium text-slate-800">{p.name}</span>
            <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
              {p.type === 'probe' ? '探针' : '引物'}
            </span>
          </div>
          <CopyableSequence sequence={p.sequence} />
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Tm: {p.tm?.toFixed(1) ?? '-'}</span>
            <span>GC: {formatGcPercent(p.gc_percent)}</span>
            <span>管数: {p.active_tube_count ?? 0}</span>
          </div>
        </Link>
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
      className="font-sequence text-xs text-slate-500 mb-2 truncate block hover:text-blue-600 cursor-pointer transition-colors"
    >
      {copied ? <span className="text-green-600">已复制 ✓</span> : truncateSequence(sequence)}
    </button>
  )
}
