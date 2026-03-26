import { useState, useCallback, useRef } from 'react'

interface Props {
  readonly onFile: (file: File) => void
  readonly uploading: boolean
}

export default function DropZone({ onFile, uploading }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-lab-accent bg-lab-accent/5'
          : 'border-lab-border hover:border-lab-border-light bg-lab-surface'
      }`}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />
      {uploading ? (
        <p className="text-sm text-lab-accent">上传中...</p>
      ) : (
        <>
          <svg className="mx-auto w-10 h-10 text-lab-faint mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm text-lab-text">拖拽 Excel 文件到此处</p>
          <p className="text-xs text-lab-muted mt-1">或点击选择文件 (.xlsx)</p>
        </>
      )}
    </div>
  )
}
