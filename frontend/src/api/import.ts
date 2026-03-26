import client from './client'
import type { ImportPreview, ImportConfirmOptions, ImportConfirmResult, DatabaseBackupResult } from '@/types'

export function downloadTemplate() {
  return client.get('/import/template', { responseType: 'blob' })
}

export function previewImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  return client.post<ImportPreview>('/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function confirmImport(file: File, options: ImportConfirmOptions) {
  const form = new FormData()
  form.append('file', file)
  form.append('options', JSON.stringify(options))
  return client.post<ImportConfirmResult>('/import/confirm', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function exportPrimersXlsx() {
  return client.get('/import/export/primers', { responseType: 'blob' })
}

export function exportBoxesXlsx() {
  return client.get('/import/export/boxes', { responseType: 'blob' })
}

export function exportProjectsXlsx() {
  return client.get('/import/export/projects', { responseType: 'blob' })
}

export function backupDatabase() {
  return client.post<DatabaseBackupResult>('/import/backup')
}
