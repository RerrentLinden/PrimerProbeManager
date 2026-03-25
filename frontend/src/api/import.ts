import client from './client'
import type { ImportPreview } from '@/types'

export function downloadTemplate() {
  return client.get('/import/template', { responseType: 'blob' })
}

export function uploadPreview(file: File) {
  const form = new FormData()
  form.append('file', file)
  return client.post<ImportPreview>('/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function confirmImport() {
  return client.post('/import/confirm')
}
