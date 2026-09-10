import { useMemo, useState } from 'react'
import { schedules, TARGET_YEAR } from './schedule.js'
import { buildEvents, eventTitle, KINDS } from './schedule-events.mjs'
import { toIcs, googleCalendarUrl } from './calendar-export.mjs'
import { KIND_SLUG } from './calendar-grid.mjs'
import { useLang } from './i18n.jsx'
import CalendarView from './CalendarView.jsx'
import TimelineView from './TimelineView.jsx'
import ScheduleList from './ScheduleList.jsx'

const ALL_EVENTS = buildEvents(schedules)

// 各校簡章陸續公告，資料會是混合年度：只有「一所都還沒有 TARGET_YEAR」時才顯示全站警示，
// 個別學校的往年資料由清單上的「參考往年」標籤標示。
const SCHOOLS_WITH_TARGET = schedules.filter((s) =>
  s.rounds.some((r) => r.academicYear === TARGET_YEAR),
).length
const IS_STALE = SCHOOLS_WITH_TARGET === 0
const DATA_YEAR = schedules[0]?.rounds?.[0]?.academicYear ?? ''

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

export function downloadIcs(events, filename, kindFn) {
  const blob = new Blob([toIcs(events, { kindFn })], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ScheduleView() {
  const { t, kind, school: schoolName } = useLang()
  const [mode, setMode] = useState('calendar')
  const [selSchools, setSelSchools] = useState([])
  const [selKinds, setSelKinds] = useState([])
  const [selected, setSelected] = useState(null)

  const modes = [
    ['calendar', t('viewCalendar')],
    ['timeline', t('viewTimeline')],
    ['list', t('viewList')],
  ]

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

  const downloadSchool = (school) =>
    downloadIcs(
      ALL_EVENTS.filter((e) => e.school === school),
      `compass-${school}.ics`,
      kind,
    )

  return (
    <>
      <div className="sched-bar">
        <nav className="tabs sub">
          {modes.map(([id, label]) => (
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
        <button
          type="button"
          className="ics-btn"
          onClick={() => downloadIcs(events, 'compass-schedule.ics', kind)}
        >
          ⤓ {t('downloadIcs')}（{events.length} {t('eventsSuffix')}）
        </button>
      </div>

      {IS_STALE ? (
        <div className="stale-notice">
          <strong>⚠ {t('staleTitle', { year: DATA_YEAR })}</strong>
          <p>{t('staleBody', { target: TARGET_YEAR })}</p>
        </div>
      ) : (
        SCHOOLS_WITH_TARGET < schedules.length && (
          <div className="stale-notice partial">
            <p>
              {t('partialNotice', {
                target: TARGET_YEAR,
                done: SCHOOLS_WITH_TARGET,
                total: schedules.length,
              })}
            </p>
          </div>
        )
      )}

      <p className="sched-intro">{t('schedIntro')}</p>

      <div className="filters">
        <fieldset>
          <legend>{t('school')}</legend>
          {schedules.map((s) => (
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
        {mode !== 'list' && (
          <fieldset>
            <legend>{t('eventKind')}</legend>
            {KINDS.map((k) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={selKinds.includes(k)}
                  onChange={() => setSelKinds(toggle(selKinds, k))}
                />
                <span className={`kind-dot ${KIND_SLUG[k]}`} />
                {kind(k)}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {selected && (
        <div className="event-detail">
          <div className="ed-head">
            <strong>{eventTitle(selected, kind)}</strong>
            <span className="year">
              {selected.start}
              {selected.end !== selected.start && ` ~ ${selected.end}`}
            </span>
            <button
              type="button"
              className="ed-close"
              aria-label={t('close')}
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
          {selected.note && <p className="notes">✎ {selected.note}</p>}
          <p className="links">
            <button type="button" className="ics-btn sm" onClick={() => downloadSchool(selected.school)}>
              ⤓ {t('downloadSchool')}
            </button>
            <a href={googleCalendarUrl(selected, kind)} target="_blank" rel="noreferrer">
              {t('addToGoogle')}
            </a>
            {selected.source && (
              <a href={selected.source} target="_blank" rel="noreferrer">
                {t('officialDoc')}
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
      {mode === 'list' && (
        <ScheduleList schedules={shownSchedules} onDownloadSchool={downloadSchool} />
      )}
    </>
  )
}
