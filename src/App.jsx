import { useEffect, useMemo, useState } from 'react'
import { professors, schools } from './data.js'
import { filterProfessors } from './filter.mjs'

const DEPT_TYPES = ['資工', '偏所', '資管', '電機']
const FAV_KEY = 'compass-favs'
const THEME_KEY = 'compass-theme'

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

const profId = (p) => `${p.school}-${p.dept}-${p.name}`

// ponytail: 熱門領域取全站出現次數前 24 名；tag 中英文正規化後這份名單會更乾淨（見 README TODO）
const TOP_AREAS = (() => {
  const count = new Map()
  for (const p of professors) for (const a of p.areas) count.set(a, (count.get(a) ?? 0) + 1)
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([a]) => a)
})()

const loadFavs = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selSchools, setSelSchools] = useState([])
  const [selTypes, setSelTypes] = useState([])
  const [selAreas, setSelAreas] = useState([])
  const [favs, setFavs] = useState(loadFavs)
  const [favOnly, setFavOnly] = useState(false)
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem(THEME_KEY) ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleFav = (id) => {
    const next = new Set(favs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setFavs(next)
    localStorage.setItem(FAV_KEY, JSON.stringify([...next]))
  }

  const results = useMemo(() => {
    const base = filterProfessors(professors, {
      query,
      schools: selSchools,
      deptTypes: selTypes,
      areas: selAreas,
    })
    return favOnly ? base.filter((p) => favs.has(profId(p))) : base
  }, [query, selSchools, selTypes, selAreas, favOnly, favs])

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
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
        <p className="tagline">台灣國立大學資訊領域教授查詢 · Comprehensive Professor and School Search System</p>
        <input
          type="search"
          aria-label="搜尋"
          placeholder="搜尋姓名、實驗室、研究領域…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="filters">
        <fieldset>
          <legend>學校</legend>
          {schools.map((s) => (
            <label key={s.school}>
              <input
                type="checkbox"
                checked={selSchools.includes(s.school)}
                onChange={() => setSelSchools(toggle(selSchools, s.school))}
              />
              {s.school}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>系所類型</legend>
          {DEPT_TYPES.map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                checked={selTypes.includes(t)}
                onChange={() => setSelTypes(toggle(selTypes, t))}
              />
              {t}
            </label>
          ))}
          <label className="fav-only">
            <input type="checkbox" checked={favOnly} onChange={() => setFavOnly(!favOnly)} />
            ⭐ 只看最愛（{favs.size}）
          </label>
        </fieldset>
        <details className="top-areas">
          <summary>熱門領域</summary>
          <div className="tags">
            {TOP_AREAS.map((a) => (
              <button
                type="button"
                key={a}
                className={selAreas.includes(a) ? 'tag on' : 'tag'}
                aria-pressed={selAreas.includes(a)}
                onClick={() => setSelAreas(toggle(selAreas, a))}
              >
                {a}
              </button>
            ))}
          </div>
        </details>
        {selAreas.length > 0 && (
          <div className="active-areas">
            領域篩選：
            {selAreas.map((a) => (
              <button type="button" key={a} onClick={() => setSelAreas(toggle(selAreas, a))}>
                {a} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="count">
        {results.length} / {professors.length} 位教授
      </p>

      <ul className="cards">
        {results.map((p) => {
          const id = profId(p)
          return (
            <li key={id} className="card">
              <div className="card-head">
                <strong>{p.name}</strong>
                <span className="title">{p.title}</span>
                <span className="school">
                  {p.school}・{p.dept}
                </span>
                <button
                  type="button"
                  className={favs.has(id) ? 'fav on' : 'fav'}
                  aria-label={favs.has(id) ? '移除最愛' : '加入最愛'}
                  aria-pressed={favs.has(id)}
                  onClick={() => toggleFav(id)}
                >
                  {favs.has(id) ? '★' : '☆'}
                </button>
              </div>
              {p.areas.length > 0 && (
                <div className="tags">
                  {p.areas.map((a) => (
                    <button
                      type="button"
                      key={a}
                      className={selAreas.includes(a) ? 'tag on' : 'tag'}
                      aria-pressed={selAreas.includes(a)}
                      onClick={() => setSelAreas(toggle(selAreas, a))}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
              {p.lab &&
                (p.labWebsite ? (
                  <p className="lab">
                    <a href={p.labWebsite} target="_blank" rel="noreferrer">
                      {p.lab}
                    </a>
                  </p>
                ) : (
                  <p className="lab">{p.lab}</p>
                ))}
              {p.highlights && <p className="hl">{p.highlights}</p>}
              {p.notes && <p className="notes">📝 {p.notes}</p>}
              <p className="links">
                {p.website && (
                  <a href={p.website} target="_blank" rel="noreferrer">
                    個人網頁
                  </a>
                )}
                {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
              </p>
            </li>
          )
        })}
      </ul>
      {results.length === 0 && <p className="empty">沒有符合條件的教授</p>}
    </div>
  )
}
