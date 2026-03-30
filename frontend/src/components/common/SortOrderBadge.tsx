import { useState, useCallback, useRef } from 'react'

interface Props {
  readonly value: number
  readonly onCommit: (newValue: number) => void
}

export default function SortOrderBadge({ value, onCommit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [value])

  const commit = useCallback(() => {
    setEditing(false)
    const n = parseInt(draft, 10)
    if (!Number.isNaN(n) && n >= 1 && n !== value) onCommit(n)
  }, [draft, value, onCommit])

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        onClick={e => e.stopPropagation()}
        className="w-9 h-6 text-center text-xs font-mono border border-lab-accent rounded bg-lab-surface text-lab-text focus:outline-none focus:ring-1 focus:ring-lab-accent"
        autoFocus
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      className="inline-flex items-center justify-center w-6 h-6 text-xs font-mono font-medium rounded bg-lab-raised text-lab-muted hover:bg-lab-accent/10 hover:text-lab-accent cursor-pointer select-none shrink-0 transition-colors"
      title="点击编辑编号，长按项目拖拽排序"
    >
      {value}
    </span>
  )
}
