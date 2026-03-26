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
          <tr className="border-b border-lab-border text-left text-xs font-medium text-lab-muted uppercase tracking-wider">
            <th className="pb-3 pr-3" style={{ width: '9%' }}>名称</th>
            <th className="pb-3 pr-3" style={{ width: '20%' }}>序列</th>
            <th className="pb-3 pr-3" style={{ width: '10%' }}>修饰</th>
            <th className="pb-3 pr-3" style={{ width: '5%' }}>类型</th>
            <th className="pb-3 pr-3" style={{ width: '20%' }}>项目</th>
            <th className="pb-3 pr-3" style={{ width: '8%' }}>MW</th>
            <th className="pb-3 pr-3" style={{ width: '6%' }}>Tm</th>
            <th className="pb-3 pr-3" style={{ width: '6%' }}>GC%</th>
            <th className="pb-3" style={{ width: '4%' }}>管数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lab-border/50">
          {primers.map((p) => (
            <tr key={p.id} className="hover:bg-lab-highlight/50 transition-colors">
              <td className="py-3 pr-3 truncate">
                <Link to={`/primers/${p.id}`} className="font-medium text-lab-accent hover:text-lab-accent/80">
                  {p.name}
                </Link>
              </td>
              <td className="py-3 pr-3">
                <CopyableSequence sequence={p.sequence} />
              </td>
              <td className="py-3 pr-3 text-xs text-lab-muted truncate" title={formatModifications(p)}>
                {formatModifications(p) || '-'}
              </td>
              <td className="py-3 pr-3">
                <span className={p.type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                  {p.type === 'probe' ? '探针' : '引物'}
                </span>
              </td>
              <td className="py-3 pr-3">
                <div className="flex flex-wrap gap-1">
                  {(p.projects ?? []).map((proj) => (
                    <Link
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className="text-xs bg-lab-raised text-lab-muted px-1.5 py-0.5 rounded hover:bg-lab-accent/10 hover:text-lab-accent transition-colors"
                    >
                      {proj.name}
                    </Link>
                  ))}
                  {(!p.projects || p.projects.length === 0) && <span className="text-xs text-lab-faint">-</span>}
                </div>
              </td>
              <td className="py-3 pr-3 tabular-nums text-lab-muted truncate">{p.mw?.toFixed(1) ?? '-'}</td>
              <td className="py-3 pr-3 tabular-nums text-lab-muted">{p.tm?.toFixed(1) ?? '-'}</td>
              <td className="py-3 pr-3 tabular-nums text-lab-muted">{formatGcPercent(p.gc_percent)}</td>
              <td className="py-3 tabular-nums text-lab-text">{p.active_tube_count ?? 0}</td>
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
      className="font-sequence text-xs text-lab-muted hover:text-lab-accent cursor-pointer transition-colors block w-full text-left truncate"
    >
      {copied ? <span className="text-lab-success">已复制 ✓</span> : sequence}
    </button>
  )
}
