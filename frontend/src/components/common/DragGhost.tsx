interface Props {
  readonly label: string
  readonly x: number
  readonly y: number
}

export default function DragGhost({ label, x, y }: Props) {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x - 40, top: y - 20 }}
    >
      <div className="px-3 py-1.5 rounded-lg bg-lab-accent text-white text-xs font-medium shadow-glow-blue opacity-90 max-w-[160px] truncate">
        {label}
      </div>
    </div>
  )
}
