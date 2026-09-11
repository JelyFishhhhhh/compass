// 月曆版面計算（純函式，與 React 無關）
export const KIND_SLUG = { 報名: 'apply', 審查: 'review', 面試: 'interview', 放榜: 'result' }

export const toDate = (iso) => new Date(`${iso}T00:00:00Z`)
export const toIso = (d) => d.toISOString().slice(0, 10)
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}
export const dayDiff = (a, b) => Math.round((b - a) / 86400000)
// 以週一為每週第一天
export const startOfWeek = (d) => addDays(d, -((d.getUTCDay() + 6) % 7))

export function monthsInRange(minIso, maxIso) {
  const out = []
  const end = toDate(maxIso)
  let cur = new Date(Date.UTC(toDate(minIso).getUTCFullYear(), toDate(minIso).getUTCMonth(), 1))
  while (cur <= end) {
    out.push({ year: cur.getUTCFullYear(), month: cur.getUTCMonth() })
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
  }
  return out
}

// 一個月切成數週，每週 7 天（週一起算，含前後月補齊的日子）
export function weeksOfMonth(year, month) {
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  const weeks = []
  for (let cur = startOfWeek(first); cur <= addDays(startOfWeek(last), 6); cur = addDays(cur, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)))
  }
  return weeks
}

// 時間軸同一列的事件若日期重疊會互相遮蓋，貪婪分層：能塞回舊層就塞，否則開新層
// 輸入需已依 start 排序（buildEvents 的輸出即是）
export function assignLanes(events) {
  const laneEnds = []
  const placed = events.map((e) => {
    let lane = laneEnds.findIndex((end) => end < e.start)
    if (lane === -1) {
      laneEnds.push(e.end)
      lane = laneEnds.length - 1
    } else laneEnds[lane] = e.end
    return { event: e, lane }
  })
  return { placed, laneCount: Math.max(1, laneEnds.length) }
}

// 該週要畫的事件條：算出起訖欄位與是否跨週延續
export function barsForWeek(events, week) {
  const ws = week[0]
  const we = week[6]
  const wsIso = toIso(ws)
  const weIso = toIso(we)
  return events
    .filter((e) => e.start <= weIso && e.end >= wsIso)
    .map((e) => {
      const colStart = Math.max(0, dayDiff(ws, toDate(e.start))) + 1
      const colEnd = Math.min(6, dayDiff(ws, toDate(e.end))) + 1
      return {
        event: e,
        colStart,
        span: colEnd - colStart + 1,
        continuesLeft: e.start < wsIso,
        continuesRight: e.end > weIso,
      }
    })
    .sort((a, b) => a.colStart - b.colStart || b.span - a.span)
}

// 各校簡章公告進度不同，資料會橫跨兩個年度，中間夾著整段沒有事件的月份，月曆直接跳過
export const monthsWithEvents = (events, minIso, maxIso) =>
  monthsInRange(minIso, maxIso).filter(({ year, month }) => {
    const first = toIso(new Date(Date.UTC(year, month, 1)))
    const last = toIso(new Date(Date.UTC(year, month + 1, 0)))
    return events.some((e) => e.start <= last && e.end >= first)
  })
