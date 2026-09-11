import { TARGET_YEAR } from './schedule.js'
import { useLang } from './i18n.jsx'

// 清單檢視：保留完整註記與官方簡章連結（行事曆放不下的細節）
export default function ScheduleList({ schedules, onDownloadSchool, deptTypes = [] }) {
  const { t, school: schoolName, schoolFull } = useLang()
  if (schedules.length === 0) return <p className="empty">{t('noSchools')}</p>

  const rows = [
    [t('rowApply'), (r) => (r.applyStart || r.applyEnd ? `${r.applyStart}${r.applyEnd ? ` ~ ${r.applyEnd}` : ''}` : '')],
    [t('rowReview'), (r) => r.review],
    [t('rowInterview'), (r) => r.interview],
    [t('rowResult'), (r) => r.result],
    [t('rowFee'), (r) => r.fee],
    [t('rowEligibility'), (r) => r.eligibility],
    [t('rowRules'), (r) => r.rules],
  ]

  return (
    <ul className="cards">
      {schedules.map((s) => (
        <li key={s.school} className="card sched-card">
          <div className="card-head">
            <strong>{schoolName(s.school)}</strong>
            <span className="title">{schoolFull(s.school, s.schoolFull)}</span>
            <button
              type="button"
              className="ics-btn sm push-right"
              onClick={() => onDownloadSchool(s.school)}
            >
              ⤓ .ics
            </button>
          </div>
          {s.rounds.map((r) => (
            <div key={r.round} className="round">
              <div className="round-head">
                <span className="round-name">{r.round}</span>
                <span className="year">
                  {r.academicYear} {t('academicYear')}
                </span>
                {(r.isPreviousYear || r.academicYear !== TARGET_YEAR) && (
                  <span className="prev-badge">{t('prevYear')}</span>
                )}
              </div>
              <table className="sched-table">
                <tbody>
                  {rows.map(([label, get]) => {
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
              <DeptTable round={r} deptTypes={deptTypes} />
              {r.note && <p className="notes">✎ {r.note}</p>}
              {r.source && (
                <p className="links">
                  <a href={r.source} target="_blank" rel="noreferrer">
                    {t('officialDoc')}
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

// 系所分則：簡章裡各系所自己的甄試日期／報名費。沒有 depts 的學校（簡章沒細到系所）就不顯示
function DeptTable({ round, deptTypes }) {
  const { t, deptType, dept: deptName } = useLang()
  const fields = [
    [t('rowInterview'), (d) => d.interview],
    [t('rowFee'), (d) => d.fee],
    [t('colQuota'), (d) => d.quota],
    [t('rowResult'), (d) => d.result],
  ]
  const shown = (round.depts ?? []).filter(
    (d) => deptTypes.length === 0 || deptTypes.includes(d.deptType),
  )
  if (shown.length === 0) return null
  return (
    <details className="dept-detail" open={deptTypes.length > 0}>
      <summary>
        {t('deptDetail')}（{shown.length}）
      </summary>
      <table className="sched-table dept-table">
        <tbody>
          {shown.map((d) => (
            <tr key={d.name}>
              <th>
                {deptName(d.dept)}
                <span className="dept-kind">{deptType(d.deptType)}</span>
              </th>
              <td>
                <span className="dept-name">{d.name}</span>
                {fields.map(([label, get]) =>
                  get(d) ? (
                    <span key={label} className="dept-field">
                      <b>{label}</b> {get(d)}
                    </span>
                  ) : null,
                )}
                {d.note && <span className="dept-note">✎ {d.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
