import { useEffect, useState } from 'react'
import ProfessorSearch from './ProfessorSearch.jsx'
import ScheduleView from './ScheduleView.jsx'

const THEME_KEY = 'compass-theme'
const TABS = [
  ['profs', '教授查詢'],
  ['schedule', '推甄時程'],
]

export default function App() {
  const [tab, setTab] = useState('profs')
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem(THEME_KEY) ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <h1>COMPASS</h1>
          <button
            type="button"
            className="theme-toggle"
            aria-label="切換亮暗色主題"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☾' : '☀'}
          </button>
        </div>
        <p className="tagline">台灣國立大學資訊領域教授查詢 · Comprehensive Professor and School Search System</p>
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={tab === id ? 'tab on' : 'tab'}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'profs' ? <ProfessorSearch /> : <ScheduleView />}
    </div>
  )
}
