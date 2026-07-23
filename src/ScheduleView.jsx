import { useState } from 'react'
import { schedules } from './schedule.js'

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

// 一梯次的時程列；只顯示有值的欄位
const ROWS = [
  ['報名', (r) => (r.applyStart || r.applyEnd ? `${r.applyStart}${r.applyEnd ? ` ~ ${r.applyEnd}` : ''}` : '')],
  ['資料審查', (r) => r.review],
  ['面試/複試', (r) => r.interview],
  ['放榜', (r) => r.result],
]

export default function ScheduleView() {
  const [selSchools, setSelSchools] = useState([])

  const shown = selSchools.length
    ? schedules.filter((s) => selSchools.includes(s.school))
    : schedules

  return (
    <>
      <p className="sched-intro">
        依報名截止日排序。時程為各校官方碩士班甄試簡章；請以連結之官方簡章為準。
      </p>

      <div className="filters">
        <fieldset>
          <legend>學校</legend>
          {schedules.map((s) => (
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
      </div>

      <ul className="cards">
        {shown.map((s) => (
          <li key={s.school} className="card sched-card">
            <div className="card-head">
              <strong>{s.school}</strong>
              <span className="title">{s.schoolFull}</span>
            </div>
            {s.rounds.map((r) => (
              <div key={r.round} className="round">
                <div className="round-head">
                  <span className="round-name">{r.round}</span>
                  <span className="year">{r.academicYear} 學年度</span>
                  {r.isPreviousYear && <span className="prev-badge">參考往年</span>}
                </div>
                <table className="sched-table">
                  <tbody>
                    {ROWS.map(([label, get]) => {
                      const val = get(r)
                      return val ? (
                        <tr key={label}>
                          <th>{label}</th>
                          <td>{val}</td>
                        </tr>
                      ) : null
                    })}
                  </tbody>
                </table>
                {r.note && <p className="notes">✎ {r.note}</p>}
                {r.source && (
                  <p className="links">
                    <a href={r.source} target="_blank" rel="noreferrer">
                      官方簡章
                    </a>
                  </p>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="empty">沒有符合條件的學校</p>}
    </>
  )
}
