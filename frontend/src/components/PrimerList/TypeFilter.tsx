interface Props {
  readonly value: string
  readonly onChange: (val: string) => void
}

const OPTIONS = [
  { value: '', label: '全部' },
  { value: 'primer', label: '引物' },
  { value: 'probe', label: '探针' },
] as const

export default function TypeFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
