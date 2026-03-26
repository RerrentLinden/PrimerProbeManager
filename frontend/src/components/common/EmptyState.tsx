interface Props {
  readonly icon?: string
  readonly title: string
  readonly description?: string
  readonly action?: React.ReactNode
}

export default function EmptyState({ icon = '📋', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-lab-muted">{title}</h3>
      {description && <p className="mt-1 text-sm text-lab-faint">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
