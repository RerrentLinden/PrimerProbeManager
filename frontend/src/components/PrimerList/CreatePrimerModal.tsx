import { useCallback, useEffect, useState } from 'react'
import { createPrimer, fetchModifications } from '@/api/primers'
import Modal from '@/components/common/Modal'

const NO_MODIFICATION = '无修饰'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess: () => void
}

interface PrimerFormState {
  readonly name: string
  readonly sequence: string
  readonly modification_5prime: string
  readonly modification_3prime: string
  readonly mw: string
  readonly tm: string
  readonly ug_per_od: string
  readonly nmol_per_od: string
  readonly purification_method: string
}

const INITIAL_FORM: PrimerFormState = {
  name: '',
  sequence: '',
  modification_5prime: NO_MODIFICATION,
  modification_3prime: NO_MODIFICATION,
  mw: '',
  tm: '',
  ug_per_od: '',
  nmol_per_od: '',
  purification_method: '',
}

export default function CreatePrimerModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<PrimerFormState>(INITIAL_FORM)
  const [mods, setMods] = useState<{ five_prime: string[]; three_prime: string[] }>({
    five_prime: [],
    three_prime: [],
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(INITIAL_FORM)
    setError('')
    fetchModifications().then(({ data }) => setMods(data)).catch(() => {})
  }, [open])

  const setField = useCallback((key: keyof PrimerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!isValid(form)) return
    setSubmitting(true)
    setError('')
    try {
      await createPrimer({
        name: form.name.trim(),
        sequence: form.sequence.trim(),
        modification_5prime: normalizeModification(form.modification_5prime),
        modification_3prime: normalizeModification(form.modification_3prime),
        mw: Number(form.mw),
        tm: toOptionalNumber(form.tm),
        ug_per_od: toOptionalNumber(form.ug_per_od),
        nmol_per_od: toOptionalNumber(form.nmol_per_od),
        purification_method: toOptionalString(form.purification_method),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(extractError(err, '新增失败'))
    }
    setSubmitting(false)
  }, [form, onClose, onSuccess])

  return (
    <Modal open={open} title="新增引探" onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="名称" value={form.name} onChange={(value) => setField('name', value)} required />
          <Field label="序列" value={form.sequence} onChange={(value) => setField('sequence', value)} required mono />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModField
            label="5'修饰"
            value={form.modification_5prime}
            options={mods.five_prime}
            onChange={(value) => setField('modification_5prime', value)}
          />
          <ModField
            label="3'修饰"
            value={form.modification_3prime}
            options={mods.three_prime}
            onChange={(value) => setField('modification_3prime', value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="MW" value={form.mw} onChange={(value) => setField('mw', value)} required type="number" />
          <Field label="Tm (°C)" value={form.tm} onChange={(value) => setField('tm', value)} type="number" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="ug/OD" value={form.ug_per_od} onChange={(value) => setField('ug_per_od', value)} type="number" />
          <Field label="nmol/OD" value={form.nmol_per_od} onChange={(value) => setField('nmol_per_od', value)} type="number" />
        </div>

        <Field
          label="纯化方式"
          value={form.purification_method}
          onChange={(value) => setField('purification_method', value)}
        />

        {error && <p className="text-sm text-lab-danger bg-lab-danger/10 border border-lab-danger/30 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-primary" disabled={submitting || !isValid(form)} onClick={handleSubmit}>
            {submitting ? '创建中...' : '新建引探'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  mono,
  required,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly type?: string
  readonly mono?: boolean
  readonly required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-lab-muted mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`input-field ${mono ? 'font-sequence' : ''}`}
      />
    </div>
  )
}

function ModField({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string
  readonly value: string
  readonly options: string[]
  readonly onChange: (value: string) => void
}) {
  const listId = `create-mod-list-${label.replace(/'/g, '')}`
  return (
    <div>
      <label className="block text-sm font-medium text-lab-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={listId}
        className="input-field"
      />
      <datalist id={listId}>
        {[NO_MODIFICATION, ...options].map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  )
}

function isValid(form: PrimerFormState): boolean {
  const requiredFieldsPresent = [form.name, form.sequence, form.mw].every((value) => value.trim())
  if (!requiredFieldsPresent) return false
  return [
    form.mw,
    form.tm,
    form.ug_per_od,
    form.nmol_per_od,
  ].every(isBlankOrFiniteNumber)
}

function normalizeModification(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === NO_MODIFICATION) return null
  return trimmed
}

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return Number(trimmed)
}

function isBlankOrFiniteNumber(value: string): boolean {
  const trimmed = value.trim()
  return !trimmed || Number.isFinite(Number(trimmed))
}

function toOptionalString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

function extractError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
}
