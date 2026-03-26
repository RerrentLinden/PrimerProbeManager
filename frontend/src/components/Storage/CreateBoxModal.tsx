import { useState, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { createBox } from '@/api/boxes'
import { DEFAULT_BOX_ROWS, DEFAULT_BOX_COLS } from '@/utils/constants'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function CreateBoxModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [rows, setRows] = useState(String(DEFAULT_BOX_ROWS))
  const [cols, setCols] = useState(String(DEFAULT_BOX_COLS))
  const [location, setLocation] = useState('')
  const [temperature, setTemperature] = useState('-20°C')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createBox({
        name,
        rows: parseInt(rows) || DEFAULT_BOX_ROWS,
        cols: parseInt(cols) || DEFAULT_BOX_COLS,
        storage_location: location || undefined,
        storage_temperature: temperature || undefined,
      })
      setName('')
      onSuccess()
      onClose()
    } catch { /* handled */ }
    setSubmitting(false)
  }, [name, rows, cols, location, temperature, onSuccess, onClose])

  return (
    <Modal open={open} title="新建冻存盒" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">名称 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1">行数</label>
            <input type="number" value={rows} onChange={(e) => setRows(e.target.value)} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1">列数</label>
            <input type="number" value={cols} onChange={(e) => setCols(e.target.value)} className="input-field" min="1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">保存地点</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-lab-muted mb-1">温度</label>
          <input type="text" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="input-field" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={!name.trim() || submitting} onClick={handleSubmit}>
            {submitting ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
