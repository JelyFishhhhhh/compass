// 清單檢視：保留完整註記與官方簡章連結（行事曆放不下的細節）
const ROWS = [
  ['報名', (r) => (r.applyStart || r.applyEnd ? `${r.applyStart}${r.applyEnd ? ` ~ ${r.applyEnd}` : ''}` : '')],
  ['資料審查', (r) => r.review],
  ['面試/複試', (r) => r.interview],
  ['放榜', (r) => r.result],
]

export default function ScheduleList({ schedules }) {
  if (schedules.length === 0) return <p className="empty">沒有符合條件的學校</p>
  return (
    <ul className="cards">
      {schedules.map((s) => (
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
  )
}
