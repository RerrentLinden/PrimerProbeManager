import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Primer } from '@/types'
import { truncateSequence, formatGcPercent } from '@/utils/format'

interface Props {
  readonly primers: Primer[]
}

export default function PrimerTable({ primers }: Props) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th className="pb-3 pr-4">名称</th>
            <th className="pb-3 pr-4">序列</th>
            <th className="pb-3 pr-4">类型</th>
            <th className="pb-3 pr-4">Tm</th>
            <th className="pb-3 pr-4">GC%</th>
            <th className="pb-3">活跃管数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {primers.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4">
                <Link to={`/primers/${p.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {p.name}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <CopyableSequence sequence={p.sequence} />
              </td>
              <td className="py-3 pr-4">
                <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                  {p.type === 'probe' ? '探针' : '引物'}
                </span>
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
      title="点击复制序列"
      className="font-sequence text-xs text-slate-600 hover:text-blue-600 cursor-pointer transition-colors"
    >
      {copied ? (
        <span className="text-green-600">已复制 ✓</span>
      ) : (
        truncateSequence(sequence)
      )}
    </button>
  )
}
