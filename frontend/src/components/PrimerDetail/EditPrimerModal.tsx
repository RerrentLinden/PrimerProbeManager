import { useState, useEffect, useCallback } from 'react'
import type { Primer } from '@/types'
import { updatePrimer, fetchModifications } from '@/api/primers'
import Modal from '@/components/common/Modal'
import { extractError } from '@/utils/extractError'

interface Props {
  readonly open: boolean
  readonly primer: Primer
  readonly onClose: () => void
  readonly onSuccess: () => void
}

export default function EditPrimerModal({ open, primer, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(toForm(primer))
  const [mods, setMods] = useState<{ five_prime: string[]; three_prime: string[] }>({ five_prime: [], three_prime: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(toForm(primer))
      setError('')
      fetchModifications().then(({ data }) => setMods(data)).catch(() => {})
    }
  }, [open, primer])

  const set = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError('')
    try {
      await updatePrimer(primer.id, {
        name: form.name.trim(),
        sequence: form.sequence.trim(),
        modification_5prime: form.modification_5prime || null,
        modification_3prime: form.modification_3prime || null,
        mw: Number(form.mw),
        ug_per_od: form.ug_per_od ? Number(form.ug_per_od) : null,
        nmol_per_od: form.nmol_per_od ? Number(form.nmol_per_od) : null,
        tm: form.tm ? Number(form.tm) : null,
        purification_method: form.purification_method || null,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '保存失败'))
    }
    setSaving(false)
  }, [primer.id, form, onSuccess, onClose])

  return (
    <Modal open={open} title="编辑引物信息" onClose={onClose}>
      <div className="space-y-3">
        <Field label="名称" value={form.name} onChange={(v) => set('name', v)} required />
        <Field label="序列" value={form.sequence} onChange={(v) => set('sequence', v)} mono required />

        <div className="grid grid-cols-2 gap-3">
          <ModField label="5'修饰" value={form.modification_5prime} options={mods.five_prime} onChange={(v) => set('modification_5prime', v)} />
          <ModField label="3'修饰" value={form.modification_3prime} options={mods.three_prime} onChange={(v) => set('modification_3prime', v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="MW" value={form.mw} onChange={(v) => set('mw', v)} type="number" required />
          <Field label="Tm (°C)" value={form.tm} onChange={(v) => set('tm', v)} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ug/OD" value={form.ug_per_od} onChange={(v) => set('ug_per_od', v)} type="number" />
          <Field label="nmol/OD" value={form.nmol_per_od} onChange={(v) => set('nmol_per_od', v)} type="number" />
        </div>
        <Field label="纯化方式" value={form.purification_method} onChange={(v) => set('purification_method', v)} />
        {error && <p className="rounded-lg border border-lab-danger/30 bg-lab-danger/10 px-3 py-2 text-sm text-lab-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={saving || !isValid(form)} onClick={handleSave}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, value, onChange, type = 'text', mono, required }: {
  readonly label: string
  readonly value: string
  readonly onChange: (v: string) => void
  readonly type?: string
  readonly mono?: boolean
  readonly required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-lab-muted mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${mono ? 'font-sequence' : ''}`}
      />
    </div>
  )
}

function ModField({ label, value, options, onChange }: {
  readonly label: string
  readonly value: string
  readonly options: string[]
  readonly onChange: (v: string) => void
}) {
  const listId = `mod-list-${label.replace(/'/g, '')}`
  return (
    <div>
      <label className="block text-xs font-medium text-lab-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        className="input-field"
        placeholder="留空则无修饰"
      />
      <datalist id={listId}>
        {options.map((m) => <option key={m} value={m} />)}
      </datalist>
    </div>
  )
}

function toForm(p: Primer) {
  return {
    name: p.name,
    sequence: p.sequence,
    modification_5prime: p.modification_5prime ?? '',
    modification_3prime: p.modification_3prime ?? '',
    mw: p.mw?.toString() ?? '',
    ug_per_od: p.ug_per_od?.toString() ?? '',
    nmol_per_od: p.nmol_per_od?.toString() ?? '',
    tm: p.tm?.toString() ?? '',
    purification_method: p.purification_method ?? '',
  }
}

function isValid(form: ReturnType<typeof toForm>): boolean {
  const requiredFieldsPresent = [form.name, form.sequence, form.mw].every((value) => value.trim())
  if (!requiredFieldsPresent) return false
  return [form.mw, form.tm, form.ug_per_od, form.nmol_per_od].every(isBlankOrFiniteNumber)
}

function isBlankOrFiniteNumber(value: string): boolean {
  const trimmed = value.trim()
  return !trimmed || Number.isFinite(Number(trimmed))
}
