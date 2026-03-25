import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'

const NAV_ITEMS = [
  { path: '/primers', label: '引物列表', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/storage', label: '位置管理', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { path: '/projects', label: '项目', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/import', label: '导入', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
] as const

export default function Sidebar() {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()

  const handleSearch = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && searchValue.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
        setSearchValue('')
      }
    },
    [searchValue, navigate],
  )

  return (
    <aside className="w-60 h-screen sticky top-0 bg-lab-surface text-lab-text flex flex-col border-r border-lab-border">
      <div className="p-5">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-lab-accent">Primer</span>Manager
        </h1>
        <p className="text-xs text-lab-muted mt-0.5">引物探针管理系统</p>
      </div>

      <div className="px-4 mb-4">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lab-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="全局搜索..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-lab-bg text-sm text-lab-text placeholder:text-lab-muted border border-lab-border focus:outline-none focus:border-lab-accent"
          />
        </div>
      </div>

      <nav className="flex-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? 'bg-lab-accent/10 text-lab-accent'
                  : 'text-lab-muted hover:bg-lab-bg hover:text-lab-text'
              }`
            }
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
