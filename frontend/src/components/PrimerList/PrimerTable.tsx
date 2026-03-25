import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Primer } from '@/types'
import { formatGcPercent } from '@/utils/format'

interface Props {
  readonly primers: Primer[]
}

function formatModifications(p: Primer): string {
  const parts: string[] = []
  if (p.modification_5prime) parts.push(`5'${p.modification_5prime}`)
  if (p.modification_3prime) parts.push(`3'${p.modification_3prime}`)
  return parts.join(' / ')
}

export default function PrimerTable({ primers }: Props) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th className="pb-3 pr-3" style={{ width: '12%' }}>名称</th>
            <th className="pb-3 pr-3" style={{ width: '26%' }}>序列</th>
            <th className="pb-3 pr-3" style={{ width: '20%' }}>修饰</th>
            <th className="pb-3 pr-3" style={{ width: '6%' }}>类型</th>
            <th className="pb-3 pr-3" style={{ width: '10%' }}>MW</th>
            <th className="pb-3 pr-3" style={{ width: '7%' }}>Tm</th>
            <th className="pb-3 pr-3" style={{ width: '7%' }}>GC%</th>
            <th className="pb-3" style={{ width: '7%' }}>管数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {primers.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4 truncate">
                <Link to={`/primers/${p.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {p.name}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <CopyableSequence sequence={p.sequence} />
              </td>
              <td className="py-3 pr-4 text-xs text-slate-500 truncate" title={formatModifications(p)}>
                {formatModifications(p)}
              </td>
              <td className="py-3 pr-4">
                <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                  {p.type === 'probe' ? '探针' : '引物'}
                </span>
              </td>
              <td className="py-3 pr-4 tabular-nums text-slate-600 truncate">
                {p.mw?.toFixed(1) ?? '-'}
              </td>
              <td className="py-3 pr-4 tabular-nums text-slate-600">{p.tm?.toFixed(1) ?? '-'}</td>
              <td className="py-3 pr-4 tabular-nums text-slate-600">{formatGcPercent(p.gc_percent)}</td>
              <td className="py-3 tabular-nums">{p.active_tube_count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CopyableSequence({ sequence }: { readonly sequence: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    await navigator.clipboard.writeText(sequence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [sequence])

  return (
    <button
      type="button"
      onClick={handleClick}
      title="点击复制完整序列"
      className="font-sequence text-xs text-slate-600 hover:text-blue-600 cursor-pointer transition-colors block w-full text-left truncate"
    >
      {copied ? (
        <span className="text-green-600">已复制 ✓</span>
      ) : (
        sequence
      )}
    </button>
  )
}
