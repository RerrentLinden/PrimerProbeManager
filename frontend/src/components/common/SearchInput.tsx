import { useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useEffect } from 'react'

interface Props {
  readonly placeholder?: string
  readonly onSearch: (query: string) => void
  readonly className?: string
}

export default function SearchInput({ placeholder = '搜索...', onSearch, className = '' }: Props) {
  const [value, setValue] = useState('')
  const debounced = useDebounce(value)

  useEffect(() => {
    onSearch(debounced)
  }, [debounced, onSearch])

  const handleClear = useCallback(() => {
    setValue('')
  }, [])

  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lab-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lab-muted hover:text-lab-text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
