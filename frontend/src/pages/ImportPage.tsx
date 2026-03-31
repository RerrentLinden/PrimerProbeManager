import { useCallback, useMemo, useState } from 'react'

import {
  backupDatabase,
  confirmImport,
  downloadTemplate,
  exportBoxesXlsx,
  exportPrimersXlsx,
  exportProjectsXlsx,
  previewImport,
} from '@/api/import'
import DropZone from '@/components/Import/DropZone'
import PreviewTable from '@/components/Import/PreviewTable'
import type {
  ImportConfirmOptions,
  ImportPreview,
  PrimerConflictResolution,
  PrimerConflictStrategy,
} from '@/types'
import { extractError } from '@/utils/extractError'

type ExportKind = 'primers' | 'boxes' | 'projects'
type ResolutionMap = Record<string, PrimerConflictResolution>

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [resolutions, setResolutions] = useState<ResolutionMap>({})
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const confirmDisabled = useMemo(
    () => !preview || preview.error_count > 0 || hasInvalidResolution(preview, resolutions),
    [preview, resolutions],
  )

  const handleDownloadTemplate = useCallback(async () => {
    setError('')
    try {
      const response = await downloadTemplate()
      downloadBlob(
        response.data,
        parseFilename(response.headers['content-disposition']) ?? 'primer_import_export_template.xlsx',
      )
    } catch (err: unknown) {
      setError(extractError(err, '模板下载失败'))
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    setError('')
    setResult('')
    setSelectedFile(file)
    try {
      const { data } = await previewImport(file)
      setPreview(data)
      setResolutions(buildInitialResolutions(data))
    } catch (err: unknown) {
      setPreview(null)
      setSelectedFile(null)
      setResolutions({})
      setError(extractError(err, '预览失败'))
    }
    setUploading(false)
  }, [])

  const handleResolutionChange = useCallback(
    (importKey: string, strategy: PrimerConflictStrategy, renamedName: string) => {
      setResolutions((prev) => ({
        ...prev,
        [importKey]: {
          import_key: importKey,
          strategy,
          renamed_name: strategy === 'rename' ? renamedName : null,
        },
      }))
    },
    [],
  )

  const handleConfirm = useCallback(async () => {
    if (!selectedFile || !preview) return
    setConfirming(true)
    setError('')
    setResult('')
    const options: ImportConfirmOptions = {
      default_conflict_strategy: 'error',
      primer_conflict_resolutions: Object.values(resolutions),
    }
    try {
      const { data } = await confirmImport(selectedFile, options)
      setResult(buildImportResult(data))
      setPreview(null)
      setSelectedFile(null)
      setResolutions({})
    } catch (err: unknown) {
      setError(extractError(err, '导入确认失败'))
    }
    setConfirming(false)
  }, [preview, resolutions, selectedFile])

  const handleExport = useCallback(async (kind: ExportKind) => {
    setExporting(kind)
    setError('')
    try {
      const response = kind === 'primers'
        ? await exportPrimersXlsx()
        : kind === 'boxes'
          ? await exportBoxesXlsx()
          : await exportProjectsXlsx()
      downloadBlob(
        response.data,
        parseFilename(response.headers['content-disposition']) ?? `${kind}-export.xlsx`,
      )
    } catch (err: unknown) {
      setError(extractError(err, '导出失败'))
    }
    setExporting(null)
  }, [])

  const handleBackup = useCallback(async () => {
    setBackingUp(true)
    setError('')
    setResult('')
    try {
      const { data } = await backupDatabase()
      setResult(`数据库备份完成：${data.file_name}（${data.file_path}）`)
    } catch (err: unknown) {
      setError(extractError(err, '数据库备份失败'))
    }
    setBackingUp(false)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-lab-text">导入导出</h1>

      <section className="card space-y-4 p-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-lab-muted">批量导入引探与分管</h2>
          <button type="button" className="btn-secondary text-sm" onClick={handleDownloadTemplate}>
            下载 Excel 模板
          </button>
        </header>

        <DropZone onFile={(file) => void handleFile(file)} uploading={uploading} />
        {selectedFile && <p className="text-xs text-lab-muted">当前文件：{selectedFile.name}</p>}

        {preview && (
          <div className="space-y-4 rounded-lg border border-lab-border p-3">
            {preview.primer_conflict_count > 0 && (
              <div className="rounded-lg border border-lab-probe/30 bg-lab-probe/10 px-3 py-3 text-sm text-lab-probe">
                <p className="font-medium">检测到 {preview.primer_conflict_count} 条引探唯一性冲突</p>
                <p className="mt-1 text-xs text-lab-probe/80">
                  每条冲突都需要显式选择策略。推荐先用“重命名”处理，效果类似同名文件自动改名。
                </p>
              </div>
            )}

            <PreviewTable
              preview={preview}
              resolutions={resolutions}
              onResolutionChange={handleResolutionChange}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  setResolutions({})
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={confirming || confirmDisabled}
                onClick={handleConfirm}
              >
                {confirming ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-lab-muted">数据导出（xlsx）</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={exporting !== null}
            onClick={() => void handleExport('primers')}
          >
            {exporting === 'primers' ? '导出中...' : '导出引探数据'}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={exporting !== null}
            onClick={() => void handleExport('boxes')}
          >
            {exporting === 'boxes' ? '导出中...' : '导出冻存盒数据'}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={exporting !== null}
            onClick={() => void handleExport('projects')}
          >
            {exporting === 'projects' ? '导出中...' : '导出项目数据'}
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-lab-muted">数据库全量备份</h2>
        <button type="button" className="btn-primary text-sm" disabled={backingUp} onClick={handleBackup}>
          {backingUp ? '备份中...' : '备份到服务器'}
        </button>
      </section>

      {error && <p className="rounded-lg border border-lab-danger/30 bg-lab-danger/10 px-3 py-2 text-sm text-lab-danger">{error}</p>}
      {result && <p className="rounded-lg border border-lab-success/30 bg-lab-success/10 px-3 py-2 text-sm text-lab-success">{result}</p>}
    </div>
  )
}

function buildInitialResolutions(preview: ImportPreview): ResolutionMap {
  return Object.fromEntries(
    preview.primers
      .filter((row) => row.action === 'conflict')
      .map((row) => [
        row.import_key,
        {
          import_key: row.import_key,
          strategy: pickDefaultStrategy(row.available_strategies),
          renamed_name: row.suggested_name ?? `${row.name}_导入1`,
        },
      ]),
  )
}

function pickDefaultStrategy(strategies: readonly PrimerConflictStrategy[]): PrimerConflictStrategy {
  if (strategies.includes('rename')) return 'rename'
  return strategies[0] ?? 'skip'
}

function hasInvalidResolution(preview: ImportPreview, resolutions: ResolutionMap): boolean {
  return preview.primers.some((row) => {
    if (row.action !== 'conflict') return false
    const resolution = resolutions[row.import_key]
    if (!resolution) return true
    if (resolution.strategy !== 'rename') return false
    return !resolution.renamed_name?.trim()
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildImportResult(data: {
  readonly primers_created: number
  readonly primers_updated: number
  readonly primers_renamed: number
  readonly primers_skipped: number
  readonly tubes_created: number
  readonly tubes_updated: number
  readonly tubes_skipped: number
  readonly tubes_placed: number
}): string {
  return [
    `引探新增 ${data.primers_created}`,
    `引探更新 ${data.primers_updated}`,
    `引探重命名 ${data.primers_renamed}`,
    `引探跳过 ${data.primers_skipped}`,
    `分管新增 ${data.tubes_created}`,
    `分管更新 ${data.tubes_updated}`,
    `分管跳过 ${data.tubes_skipped}`,
    `分管放置 ${data.tubes_placed}`,
  ].join('，')
}

function parseFilename(contentDisposition?: string): string | null {
  const match = contentDisposition?.match(/filename=\"?([^"]+)\"?/)
  return match?.[1] ?? null
}
