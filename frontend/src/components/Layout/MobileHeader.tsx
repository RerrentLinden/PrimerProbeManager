import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Logo from '@/components/common/Logo'

export default function MobileHeader() {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`)
        setQuery('')
        setShowSearch(false)
      }
    },
    [query, navigate],
  )

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-metal-sidebar text-lab-text border-b border-lab-border shadow-panel px-4 h-12 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Logo size={28} />
        <h1 className="text-sm font-bold text-lab-text">Manager</h1>
      </div>
      {showSearch ? (
        <form onSubmit={handleSubmit} className="flex-1 ml-3">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setShowSearch(false)}
            placeholder="全局搜索"
            className="input-field px-3 py-1 text-sm"
          />
        </form>
      ) : (
        <button type="button" onClick={() => setShowSearch(true)} className="text-lab-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}
    </header>
  )
}
