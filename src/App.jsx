import { useMemo, useState } from 'react'
import { professors, schools } from './data.js'
import { filterProfessors } from './filter.mjs'

const DEPT_TYPES = ['資工', '偏所', '資管', '電機']

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

export default function App() {
  const [query, setQuery] = useState('')
  const [selSchools, setSelSchools] = useState([])
  const [selTypes, setSelTypes] = useState([])
  const [selAreas, setSelAreas] = useState([])

  const results = useMemo(
    () => filterProfessors(professors, { query, schools: selSchools, deptTypes: selTypes, areas: selAreas }),
    [query, selSchools, selTypes, selAreas],
  )

  return (
    <div className="app">
      <header>
        <h1>台灣國立大學資訊領域教授查詢</h1>
        <input
          type="search"
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
        </fieldset>
        {selAreas.length > 0 && (
          <div className="active-areas">
            領域篩選：
            {selAreas.map((a) => (
              <button key={a} onClick={() => setSelAreas(toggle(selAreas, a))}>
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
        {results.map((p) => (
          <li key={`${p.school}-${p.dept}-${p.name}`} className="card">
            <div className="card-head">
              <strong>{p.name}</strong>
              <span className="title">{p.title}</span>
              <span className="school">
                {p.school}・{p.dept}
              </span>
            </div>
            {p.areas.length > 0 && (
              <div className="tags">
                {p.areas.map((a) => (
                  <button
                    key={a}
                    className={selAreas.includes(a) ? 'tag on' : 'tag'}
                    onClick={() => setSelAreas(toggle(selAreas, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            {p.lab && <p className="lab">{p.lab}</p>}
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
        ))}
      </ul>
      {results.length === 0 && <p className="empty">沒有符合條件的教授</p>}
    </div>
  )
}
