interface Props {
  readonly open: boolean
  readonly title: string
  readonly message: string
  readonly confirmLabel?: string
  readonly danger?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = '确认', danger, onConfirm, onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="card p-6 w-full max-w-sm mx-4 shadow-modal">
        <h3 className="text-lg font-semibold text-lab-text">{title}</h3>
        <p className="mt-2 text-sm text-lab-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel}>取消</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
