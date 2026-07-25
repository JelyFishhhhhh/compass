import { KIND_SLUG, monthsInRange, weeksOfMonth, barsForWeek, toIso } from './calendar-grid.mjs'
import { eventTitle } from './schedule-events.mjs'
import { useLang } from './i18n.jsx'

export default function CalendarView({ events, selected, onSelect }) {
  const { t, kind, monthLabel } = useLang()
  if (events.length === 0) return <p className="empty">{t('noEvents')}</p>

  const minIso = events.reduce((m, e) => (e.start < m ? e.start : m), events[0].start)
  const maxIso = events.reduce((m, e) => (e.end > m ? e.end : m), events[0].end)

  return (
    <div className="calendar">
      {monthsInRange(minIso, maxIso).map(({ year, month }) => (
        <section key={`${year}-${month}`} className="cal-month">
          <h3>{monthLabel(year, month)}</h3>
          <div className="cal-weekdays">
            {t('weekdays').map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          {weeksOfMonth(year, month).map((week) => (
            <div key={toIso(week[0])} className="cal-week">
              {week.map((day) => (
                <div
                  key={toIso(day)}
                  className={day.getUTCMonth() === month ? 'cal-day' : 'cal-day out'}
                >
                  {day.getUTCDate()}
                </div>
              ))}
              {barsForWeek(events, week).map(({ event, colStart, span, continuesLeft, continuesRight }) => (
                <button
                  type="button"
                  key={`${event.id}-${toIso(week[0])}`}
                  className={[
                    'cal-bar',
                    KIND_SLUG[event.kind],
                    selected?.id === event.id ? 'on' : '',
                    continuesLeft ? 'cont-l' : '',
                    continuesRight ? 'cont-r' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ gridColumn: `${colStart} / span ${span}` }}
                  title={`${eventTitle(event, kind)}（${event.start}${event.end !== event.start ? ` ~ ${event.end}` : ''}）`}
                  onClick={() => onSelect(selected?.id === event.id ? null : event)}
                >
                  {eventTitle(event, kind)}
                </button>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
