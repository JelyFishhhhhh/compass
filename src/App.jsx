import { useEffect, useState } from 'react'
import { LangProvider, useLang } from './i18n.jsx'
import ProfessorSearch from './ProfessorSearch.jsx'
import ScheduleView from './ScheduleView.jsx'

const THEME_KEY = 'compass-theme'

function Shell() {
  const { t, lang, toggleLang } = useLang()
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

  const tabs = [
    ['profs', t('tabProfs')],
    ['schedule', t('tabSchedule')],
  ]

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <h1>COMPASS</h1>
          <div className="header-actions">
            <button type="button" className="lang-toggle" aria-label={t('langToggle')} onClick={toggleLang}>
              {lang === 'zh' ? 'EN' : '中'}
            </button>
            <button
              type="button"
              className="theme-toggle"
              aria-label={t('themeToggle')}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '☾' : '☀'}
            </button>
          </div>
        </div>
        <p className="tagline">{t('tagline')}</p>
        <nav className="tabs">
          {tabs.map(([id, label]) => (
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

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  )
}
