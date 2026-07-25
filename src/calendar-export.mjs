import { eventTitle } from './schedule-events.mjs'

const esc = (s) => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
const compact = (iso) => iso.replaceAll('-', '')

// RFC 5545：每行不得超過 75 octets，續行以一個空白開頭。
// 中文一字 3 bytes，註記很容易超長，需依「位元組」而非字元數折行（且不可切斷多位元組字元）。
export function foldLine(line) {
  const enc = new TextEncoder()
  const parts = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74 // 續行會補一個前導空白
    if (bytes + n > limit) {
      parts.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

// 全天事件的結束日在 iCalendar / Google Calendar 都是「不含當天」，故要 +1
export function nextDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// kindFn：把事件類型翻成目前介面語言，讓匯出的行事曆與畫面一致
export function toIcs(events, { now = new Date(), kindFn } = {}) {
  const dtstamp = `${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//COMPASS//推甄時程//ZH-TW',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:COMPASS 推甄時程',
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      // UID 需為 ASCII，校名等中文以百分比編碼保持穩定且可讀回
      `UID:${encodeURIComponent(e.id)}@compass`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.end))}`,
      `SUMMARY:${esc(eventTitle(e, kindFn))}`,
    )
    if (e.note) lines.push(`DESCRIPTION:${esc(e.note)}`)
    if (e.source) lines.push(`URL:${esc(e.source)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

export function googleCalendarUrl(e, kindFn) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(e, kindFn),
    dates: `${compact(e.start)}/${compact(nextDay(e.end))}`,
    details: [e.note, e.source].filter(Boolean).join('\n'),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}
