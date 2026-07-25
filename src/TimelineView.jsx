import { KIND_SLUG, toDate, dayDiff, monthsInRange, assignLanes } from './calendar-grid.mjs'
import { eventTitle } from './schedule-events.mjs'

const LANE_H = 17

export default function TimelineView({ events, selected, onSelect }) {
  if (events.length === 0) return <p className="empty">沒有符合條件的事件</p>

  const minIso = events.reduce((m, e) => (e.start < m ? e.start : m), events[0].start)
  const maxIso = events.reduce((m, e) => (e.end > m ? e.end : m), events[0].end)
  const min = toDate(minIso)
  const total = dayDiff(min, toDate(maxIso)) + 1
  const pct = (n) => `${(n / total) * 100}%`

  // 每校一列，依該校最早事件排序
  const bySchool = new Map()
  for (const e of events) {
    if (!bySchool.has(e.school)) bySchool.set(e.school, [])
    bySchool.get(e.school).push(e)
  }
  const rows = [...bySchool.entries()].sort(
    (a, b) => a[1][0].start.localeCompare(b[1][0].start) || a[0].localeCompare(b[0], 'zh-Hant'),
  )

  const months = monthsInRange(minIso, maxIso).map(({ year, month }) => {
    const first = new Date(Date.UTC(year, month, 1))
    const start = Math.max(0, dayDiff(min, first))
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const end = Math.min(total, dayDiff(min, first) + days)
    return { key: `${year}-${month}`, label: `${month + 1} 月`, left: start, width: end - start }
  })

  return (
    <div className="timeline">
      <div className="tl-months">
        <span className="tl-label" />
        <div className="tl-track">
          {months.map((m) => (
            <span key={m.key} className="tl-month" style={{ left: pct(m.left), width: pct(m.width) }}>
              {m.label}
            </span>
          ))}
        </div>
      </div>
      {rows.map(([school, evs]) => {
        const { placed, laneCount } = assignLanes(evs)
        return (
          <div key={school} className="tl-row">
            <span className="tl-label">{school}</span>
            <div className="tl-track" style={{ height: laneCount * LANE_H + 4 }}>
              {months.map((m) => (
                <span key={m.key} className="tl-gridline" style={{ left: pct(m.left) }} />
              ))}
              {placed.map(({ event: e, lane }) => (
                <button
                  type="button"
                  key={e.id}
                  className={`tl-bar ${KIND_SLUG[e.kind]}${selected?.id === e.id ? ' on' : ''}`}
                  style={{
                    left: pct(dayDiff(min, toDate(e.start))),
                    width: pct(dayDiff(toDate(e.start), toDate(e.end)) + 1),
                    top: lane * LANE_H + 2,
                  }}
                  title={`${eventTitle(e)}（${e.start}${e.end !== e.start ? ` ~ ${e.end}` : ''}）`}
                  onClick={() => onSelect(selected?.id === e.id ? null : e)}
                >
                  <span className="tl-bar-text">{e.kind}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
