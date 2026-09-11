import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSegments, parseDateField, buildEvents, eventTitle, sortKey } from './schedule-events.mjs'
import { nextDay, toIcs, googleCalendarUrl, foldLine } from './calendar-export.mjs'

test('splitSegments 不切到括號內的頓號', () => {
  const s = splitSegments('2025-11-07（第一次榜示：甲、乙）、2025-11-21（第二次）')
  assert.equal(s.length, 2)
  assert.ok(s[0].includes('甲、乙'))
})

test('parseDateField 解析區間與註記', () => {
  const [d] = parseDateField('2025-10-01~2025-10-13（同報名期間線上上傳審查資料）')
  assert.equal(d.start, '2025-10-01')
  assert.equal(d.end, '2025-10-13')
  assert.equal(d.note, '同報名期間線上上傳審查資料')
})

test('parseDateField 解析多個單日', () => {
  const ds = parseDateField('2025-11-07（第一次放榜）、2025-11-14（第二次放榜）')
  assert.deepEqual(ds.map((d) => d.start), ['2025-11-07', '2025-11-14'])
  assert.equal(ds[0].end, '2025-11-07', '單日事件 end 等於 start')
})

test('parseDateField 註記內的日期不另建事件', () => {
  const ds = parseDateField('2025-11-07（放榜；新生名單另於2025-11-19公告）')
  assert.equal(ds.length, 1)
  assert.ok(ds[0].note.includes('2025-11-19'))
})

test('parseDateField 空字串回傳空陣列', () => {
  assert.deepEqual(parseDateField(''), [])
})

const SCHED = [
  {
    school: '中興',
    schoolFull: '國立中興大學',
    rounds: [
      {
        round: '一推',
        academicYear: '115',
        applyStart: '2025-10-01',
        applyEnd: '2025-10-13',
        review: '',
        interview: '',
        result: '2025-11-07（放榜）',
        source: 'https://example.edu.tw/a.pdf',
      },
    ],
  },
  {
    school: '成大',
    schoolFull: '國立成功大學',
    rounds: [
      {
        round: '甄試',
        academicYear: '115',
        applyStart: '2025-09-24',
        applyEnd: '2025-10-02',
        review: '',
        interview: '',
        result: '',
        source: '',
      },
    ],
  },
]

test('buildEvents 產生報名與放榜事件並依日期排序', () => {
  const evs = buildEvents(SCHED)
  assert.deepEqual(evs.map((e) => `${e.school}${e.kind}`), ['成大報名', '中興報名', '中興放榜'])
  assert.equal(evs[0].start, '2025-09-24')
})

test('eventTitle 甄試不重複標梯次', () => {
  assert.equal(eventTitle({ school: '成大', round: '甄試', kind: '報名' }), '成大報名')
  assert.equal(eventTitle({ school: '中興', round: '一推', kind: '放榜' }), '中興一推放榜')
})

test('eventTitle 英文事件類型才補空格', () => {
  const en = { 報名: 'Application' }
  assert.equal(eventTitle({ school: '成大', round: '甄試', kind: '報名' }, (k) => en[k]), '成大 Application')
})

test('nextDay 跨月正確', () => {
  assert.equal(nextDay('2025-10-31'), '2025-11-01')
  assert.equal(nextDay('2025-12-31'), '2026-01-01')
})

test('toIcs 全天事件的 DTEND 為結束日隔天（不含當天）', () => {
  const ics = toIcs(buildEvents(SCHED).filter((e) => e.school === '中興' && e.kind === '報名'))
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20251001'))
  assert.ok(ics.includes('DTEND;VALUE=DATE:20251014'), 'end 2025-10-13 → DTEND 20251014')
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 1)
  assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.trimEnd().endsWith('END:VCALENDAR'))
})

test('toIcs 逸出逗號與分號', () => {
  const ics = toIcs([
    { id: 'x', school: '甲', round: '甄試', kind: '放榜', start: '2025-11-07', end: '2025-11-07', note: 'a,b;c', source: '' },
  ])
  assert.ok(ics.includes('DESCRIPTION:a\\,b\\;c'))
})

const byteLen = (s) => new TextEncoder().encode(s).length

test('foldLine 依 75 octets 折行且不切斷中文字', () => {
  const long = `DESCRIPTION:${'各系所甄試日期不同詳簡章系所分則'.repeat(6)}`
  const folded = foldLine(long)
  const physical = folded.split('\r\n')
  assert.ok(physical.length > 1, '超長行必須折行')
  assert.ok(physical.every((l) => byteLen(l) <= 75), '每行不得超過 75 octets')
  assert.ok(physical.slice(1).every((l) => l.startsWith(' ')), '續行以空白開頭')
  // 反折行（去掉 CRLF + 一個空白）應還原原字串，代表沒切壞任何字元
  assert.equal(folded.replaceAll('\r\n ', ''), long)
})

test('foldLine 短行不動', () => {
  assert.equal(foldLine('SUMMARY:台大報名'), 'SUMMARY:台大報名')
})

test('toIcs 全檔每行不超過 75 octets 且 UID 為 ASCII', () => {
  const ics = toIcs([
    {
      id: '中興-一推-放榜-0',
      school: '中興',
      round: '一推',
      kind: '放榜',
      start: '2025-11-07',
      end: '2025-11-07',
      note: '第一梯次〔含逕行錄取〕放榜、參加面試名單公告；新生暨遞補順序名單另於2025-11-19公告',
      source: 'https://recruit.nchu.edu.tw/grade-exam/sele/115/115sele_Schedule.pdf',
    },
  ])
  assert.ok(ics.split('\r\n').every((l) => byteLen(l) <= 75))
  const uid = ics.split('\r\n').find((l) => l.startsWith('UID:'))
  // eslint-disable-next-line no-control-regex
  assert.ok(/^[\x00-\x7F]*$/.test(uid), `UID 須為 ASCII：${uid}`)
})

test('googleCalendarUrl 帶入標題與全天日期區間', () => {
  const url = googleCalendarUrl({
    school: '台大', round: '甄試', kind: '報名', start: '2025-10-01', end: '2025-10-08', note: '', source: '',
  })
  assert.ok(url.startsWith('https://calendar.google.com/calendar/render?'))
  const p = new URL(url).searchParams
  assert.equal(p.get('text'), '台大報名')
  assert.equal(p.get('dates'), '20251001/20251009')
})

test('sortKey 讓往年資料的學校排到最後', () => {
  const mk = (year, applyEnd) => ({ rounds: [{ academicYear: year, applyEnd }] })
  const schools = [
    ['清大', mk('115', '2025-10-14')],
    ['台大', mk('116', '2026-10-07')],
    ['台南', mk('116', '2026-09-30')],
  ]
  assert.deepEqual(
    schools.sort((a, b) => sortKey(a[1], '116').localeCompare(sortKey(b[1], '116'))).map((s) => s[0]),
    ['台南', '台大', '清大'],
  )
})
