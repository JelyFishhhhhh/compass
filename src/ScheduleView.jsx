import { useMemo, useState } from 'react'
import { schedules } from './schedule.js'
import { buildEvents, eventTitle, KINDS } from './schedule-events.mjs'
import { toIcs, googleCalendarUrl } from './calendar-export.mjs'
import { KIND_SLUG } from './calendar-grid.mjs'
import CalendarView from './CalendarView.jsx'
import TimelineView from './TimelineView.jsx'
import ScheduleList from './ScheduleList.jsx'

const MODES = [
  ['calendar', '月曆'],
  ['timeline', '時間軸'],
  ['list', '清單'],
]

const ALL_EVENTS = buildEvents(schedules)

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

function downloadIcs(events) {
  const blob = new Blob([toIcs(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'compass-推甄時程.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function ScheduleView() {
  const [mode, setMode] = useState('calendar')
  const [selSchools, setSelSchools] = useState([])
  const [selKinds, setSelKinds] = useState([])
  const [selected, setSelected] = useState(null)

  const events = useMemo(
    () =>
      ALL_EVENTS.filter(
        (e) =>
          (selSchools.length === 0 || selSchools.includes(e.school)) &&
          (selKinds.length === 0 || selKinds.includes(e.kind)),
      ),
    [selSchools, selKinds],
  )

  const shownSchedules = selSchools.length
    ? schedules.filter((s) => selSchools.includes(s.school))
    : schedules

  return (
    <>
      <div className="sched-bar">
        <nav className="tabs sub">
          {MODES.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={mode === id ? 'tab on' : 'tab'}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className="ics-btn" onClick={() => downloadIcs(events)}>
          ⤓ 下載 .ics（{events.length} 個事件）
        </button>
      </div>
      <p className="sched-intro">
        115 學年度碩士班甄試時程，資料以各校官方簡章為準。下載 .ics 可匯入 Google 日曆後分享給同學；
        點事件可單獨加入 Google 日曆。
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
        {mode !== 'list' && (
          <fieldset>
            <legend>事件類型</legend>
            {KINDS.map((k) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={selKinds.includes(k)}
                  onChange={() => setSelKinds(toggle(selKinds, k))}
                />
                <span className={`kind-dot ${KIND_SLUG[k]}`} />
                {k}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {selected && (
        <div className="event-detail">
          <div className="ed-head">
            <strong>{eventTitle(selected)}</strong>
            <span className="year">
              {selected.start}
              {selected.end !== selected.start && ` ~ ${selected.end}`}
            </span>
            <button type="button" className="ed-close" aria-label="關閉" onClick={() => setSelected(null)}>
              ✕
            </button>
          </div>
          {selected.note && <p className="notes">✎ {selected.note}</p>}
          <p className="links">
            <a href={googleCalendarUrl(selected)} target="_blank" rel="noreferrer">
              加入 Google 日曆
            </a>
            {selected.source && (
              <a href={selected.source} target="_blank" rel="noreferrer">
                官方簡章
              </a>
            )}
          </p>
        </div>
      )}

      {mode === 'calendar' && (
        <CalendarView events={events} selected={selected} onSelect={setSelected} />
      )}
      {mode === 'timeline' && (
        <TimelineView events={events} selected={selected} onSelect={setSelected} />
      )}
      {mode === 'list' && <ScheduleList schedules={shownSchedules} />}
    </>
  )
}
