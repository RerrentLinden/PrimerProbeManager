import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Logo from '@/components/common/Logo'
import { useTheme } from '@/hooks/useTheme'

type ThemeMode = 'light' | 'dark' | 'system'
const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '亮', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { value: 'dark', label: '暗', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  { value: 'system', label: '自动', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

const NAV_ITEMS = [
  { path: '/primers', label: '引探管理', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/storage', label: '存放管理', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { path: '/projects', label: '项目管理', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/logs', label: '日志记录', icon: 'M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { path: '/import', label: '导入导出', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
] as const

export default function Sidebar() {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()

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
    <aside className="w-60 h-screen sticky top-0 bg-metal-sidebar text-lab-text flex flex-col border-r border-lab-border shadow-panel">
      <div className="p-5">
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-lab-text">Manager</h1>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-lab-muted/85">PrimerProbeManager</p>
          </div>
        </div>
        <p className="text-xs text-lab-muted mt-1.5 ml-0.5">引探管理系统</p>
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
            placeholder="全局搜索"
            className="input-field pl-8 pr-3 py-1.5 text-sm"
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
                  ? 'bg-lab-accent/15 text-lab-accent shadow-glow-blue'
                  : 'text-lab-muted hover:bg-lab-raised hover:text-lab-text'
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

      {/* Theme toggle */}
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={() => {
            const idx = THEME_OPTIONS.findIndex((o) => o.value === mode)
            setMode(THEME_OPTIONS[(idx + 1) % THEME_OPTIONS.length].value)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-lab-bg text-lab-muted hover:text-lab-text transition-colors shadow-recess"
          title={THEME_OPTIONS.find((o) => o.value === mode)?.label}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={THEME_OPTIONS.find((o) => o.value === mode)?.icon} />
          </svg>
        </button>
      </div>
    </aside>
  )
}
