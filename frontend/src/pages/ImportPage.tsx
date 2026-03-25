import { useState, useCallback } from 'react'
import { downloadTemplate, uploadPreview, confirmImport } from '@/api/import'
import type { ImportPreview } from '@/types'
import DropZone from '@/components/Import/DropZone'
import PreviewTable from '@/components/Import/PreviewTable'

export default function ImportPage() {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const { data } = await downloadTemplate()
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'primer_import_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* handled */ }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    setResult(null)
    try {
      const { data } = await uploadPreview(file)
      setPreview(data)
    } catch { /* handled */ }
    setUploading(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    setConfirming(true)
    try {
      await confirmImport()
      setResult('导入完成')
      setPreview(null)
    } catch { /* handled */ }
    setConfirming(false)
  }, [])

  const hasConflicts = (preview?.conflicts.length ?? 0) > 0

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold">批量导入</h1>

      <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下载导入模板
      </button>

      <DropZone onFile={handleFile} uploading={uploading} />

      {preview && (
        <div className="card p-4 space-y-4">
          <PreviewTable preview={preview} />
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setPreview(null)}>
              取消
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={hasConflicts || confirming}
              onClick={handleConfirm}
            >
              {confirming ? '导入中...' : '确认导入'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {result}
        </div>
      )}
    </div>
  )
}
