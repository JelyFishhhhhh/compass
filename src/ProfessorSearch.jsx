import { useMemo, useState } from 'react'
import { professors, schools } from './data.js'
import { tags, tagIndex } from './tags.js'
import { filterProfessors, unitsOf } from './filter.mjs'
import { canonicalOf, displayArea } from './area-display.mjs'
import { areaI18n } from './area-i18n.js'
import { useLang } from './i18n.jsx'

const DEPT_TYPES = ['資工', '偏所', '資管', '電機']
const FAV_KEY = 'compass-favs'

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

const profId = (p) => `${p.school}-${p.dept}-${p.name}`

const ROOTS = tags.filter((t) => t.parent === null)
const childrenOf = (name) => tags.filter((t) => t.parent === name)

const loadFavs = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

export default function ProfessorSearch() {
  const { t, lang, deptType, title, school: schoolName, dept: deptName, profName } = useLang()
  const [query, setQuery] = useState('')
  const [selSchools, setSelSchools] = useState([])
  const [selTypes, setSelTypes] = useState([])
  const [selAreas, setSelAreas] = useState([])
  const [selInstitutes, setSelInstitutes] = useState([])
  const [favs, setFavs] = useState(loadFavs)
  const [favOnly, setFavOnly] = useState(false)

  // 詞彙表內的標籤一律以 canonical 名稱進篩選，顯示時再依語言轉換
  const pickArea = (raw) => setSelAreas(toggle(selAreas, canonicalOf(raw, tagIndex) ?? raw))
  const show = (raw) => displayArea(raw, tagIndex, lang, areaI18n)

  const toggleFav = (id) => {
    const next = new Set(favs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setFavs(next)
    localStorage.setItem(FAV_KEY, JSON.stringify([...next]))
  }

  const results = useMemo(
    () =>
      filterProfessors(professors, {
        query,
        schools: selSchools,
        deptTypes: selTypes,
        areas: selAreas,
        institutes: selInstitutes,
        tagIndex,
      }).filter((p) => (favOnly ? favs.has(profId(p)) : true)),
    [query, selSchools, selTypes, selAreas, selInstitutes, favOnly, favs],
  )

  const tagBtn = (raw, key) => (
    <button
      type="button"
      key={key ?? raw}
      className={selAreas.includes(canonicalOf(raw, tagIndex) ?? raw) ? 'tag on' : 'tag'}
      aria-pressed={selAreas.includes(canonicalOf(raw, tagIndex) ?? raw)}
      onClick={() => pickArea(raw)}
    >
      {show(raw)}
    </button>
  )

  return (
    <>
      <input
        type="search"
        aria-label={t('search')}
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters">
        <fieldset>
          <legend>{t('school')}</legend>
          {schools.map((s) => (
            <label key={s.school}>
              <input
                type="checkbox"
                checked={selSchools.includes(s.school)}
                onChange={() => setSelSchools(toggle(selSchools, s.school))}
              />
              {schoolName(s.school)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t('deptType')}</legend>
          {DEPT_TYPES.map((tp) => (
            <label key={tp}>
              <input
                type="checkbox"
                checked={selTypes.includes(tp)}
                onChange={() => setSelTypes(toggle(selTypes, tp))}
              />
              {deptType(tp)}
            </label>
          ))}
          <label className="fav-only">
            <input type="checkbox" checked={favOnly} onChange={() => setFavOnly(!favOnly)} />
            ★ {t('favOnly')}（{favs.size}）
          </label>
        </fieldset>
        <details className="tag-tree">
          <summary>{t('areaTree')}</summary>
          {ROOTS.map((root) => (
            <div key={root.name} className="tag-group">
              <button
                type="button"
                className={selAreas.includes(root.name) ? 'tag on' : 'tag cat'}
                aria-pressed={selAreas.includes(root.name)}
                onClick={() => setSelAreas(toggle(selAreas, root.name))}
              >
                {show(root.name)}
              </button>
              <div className="tag-children">
                {childrenOf(root.name).map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    className={selAreas.includes(c.name) ? 'tag on' : 'tag'}
                    aria-pressed={selAreas.includes(c.name)}
                    onClick={() => setSelAreas(toggle(selAreas, c.name))}
                  >
                    {show(c.name)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </details>
        {selAreas.length > 0 && (
          <div className="active-areas">
            {t('areaFilter')}
            {selAreas.map((a) => (
              <button type="button" key={a} onClick={() => setSelAreas(toggle(selAreas, a))}>
                {show(a)} ✕
              </button>
            ))}
          </div>
        )}
        {selInstitutes.length > 0 && (
          <div className="active-areas">
            {t('instituteFilter')}
            {selInstitutes.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setSelInstitutes(toggle(selInstitutes, i))}
              >
                {deptName(i)} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="count">
        {results.length} / {professors.length} {t('countSuffix')}
      </p>

      <ul className="cards">
        {results.map((p) => {
          const id = profId(p)
          return (
            <li key={id} className="card">
              <div className="card-head">
                <strong>{profName(p)}</strong>
                <span className="title">{title(p.title)}</span>
                <span className="school">{schoolName(p.school)}</span>
                <button
                  type="button"
                  className={favs.has(id) ? 'fav on' : 'fav'}
                  aria-label={favs.has(id) ? t('removeFav') : t('addFav')}
                  aria-pressed={favs.has(id)}
                  onClick={() => toggleFav(id)}
                >
                  {favs.has(id) ? '★' : '☆'}
                </button>
              </div>
              {/* 每位教授都列出可報考的系所：主聘（實心）＋兼屬偏所（虛線） */}
              <p className="institutes">
                {unitsOf(p).map((u, idx) => (
                  <button
                    type="button"
                    key={u}
                    className={[
                      idx === 0 ? 'inst primary' : 'inst',
                      selInstitutes.includes(u) ? 'on' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={selInstitutes.includes(u)}
                    onClick={() => setSelInstitutes(toggle(selInstitutes, u))}
                  >
                    {deptName(u)}
                  </button>
                ))}
              </p>
              {p.areas.length > 0 && (
                <div className="tags">{p.areas.map((a) => tagBtn(a, `${id}-${a}`))}</div>
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
              {p.notes && <p className="notes">✎ {p.notes}</p>}
              <p className="links">
                {p.website && (
                  <a href={p.website} target="_blank" rel="noreferrer">
                    {t('website')}
                  </a>
                )}
                {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
              </p>
            </li>
          )
        })}
      </ul>
      {results.length === 0 && <p className="empty">{t('noProfs')}</p>}
    </>
  )
}
