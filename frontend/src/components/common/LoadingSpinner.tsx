interface Props {
  readonly size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' } as const

export default function LoadingSpinner({ size = 'md' }: Props) {
  return (
    <div className="flex items-center justify-center py-8">
      <svg className={`animate-spin text-blue-500 ${SIZES[size]}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  )
}
