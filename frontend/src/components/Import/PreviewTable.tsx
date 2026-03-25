import type { ImportPreview } from '@/types'

interface Props {
  readonly preview: ImportPreview
}

const STATUS_STYLES = {
  new: 'bg-green-50',
  update: 'bg-yellow-50',
  conflict: 'bg-red-50',
} as const

const STATUS_LABELS = {
  new: '新增',
  update: '更新',
  conflict: '冲突',
} as const

export default function PreviewTable({ preview }: Props) {
  if (preview.rows.length === 0) return null

  const columns = Object.keys(preview.rows[0].data)

  return (
    <div>
      <div className="flex gap-4 text-sm mb-4">
        <span className="text-green-700">新增: {preview.new_primers + preview.new_tubes}</span>
        <span className="text-yellow-700">更新: {preview.update_primers + preview.update_tubes}</span>
        <span className="text-red-700">冲突: {preview.conflicts.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">状态</th>
              {columns.map((col) => (
                <th key={col} className="pb-2 pr-3">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.row_number} className={STATUS_STYLES[row.status]}>
                <td className="py-2 pr-3 text-slate-400">{row.row_number}</td>
                <td className="py-2 pr-3">
                  <span className={`text-xs font-medium ${
                    row.status === 'conflict' ? 'text-red-600' : row.status === 'new' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
                {columns.map((col) => (
                  <td key={col} className="py-2 pr-3">{row.data[col]}</td>
                ))}
                {row.error && (
                  <td className="py-2 text-red-600">{row.error}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
