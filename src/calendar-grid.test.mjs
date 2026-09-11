import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  monthsInRange,
  monthsWithEvents,
  weeksOfMonth,
  barsForWeek,
  toIso,
  startOfWeek,
  toDate,
  assignLanes,
} from './calendar-grid.mjs'

test('monthsInRange 涵蓋起訖月份', () => {
  assert.deepEqual(
    monthsInRange('2025-09-24', '2025-12-11').map((m) => `${m.year}-${m.month + 1}`),
    ['2025-9', '2025-10', '2025-11', '2025-12'],
  )
})

test('weeksOfMonth 每週七天且週一起算', () => {
  const weeks = weeksOfMonth(2025, 9) // 2025-10
  assert.ok(weeks.every((w) => w.length === 7))
  assert.ok(weeks.every((w) => w[0].getUTCDay() === 1), '每列第一天是週一')
  const flat = weeks.flat().map(toIso)
  assert.ok(flat.includes('2025-10-01') && flat.includes('2025-10-31'))
})

test('startOfWeek 週日往前推到同週週一', () => {
  // 2025-10-05 是週日，同週週一是 2025-09-29
  assert.equal(toIso(startOfWeek(toDate('2025-10-05'))), '2025-09-29')
  // 週一本身不動
  assert.equal(toIso(startOfWeek(toDate('2025-09-29'))), '2025-09-29')
})

const week = weeksOfMonth(2025, 9)[1] // 2025-10-06 ~ 10-12

test('barsForWeek 算出欄位與跨週旗標', () => {
  const [bar] = barsForWeek(
    [{ id: 'a', start: '2025-10-01', end: '2025-10-08', kind: '報名' }],
    week,
  )
  assert.equal(bar.colStart, 1, '本週之前開始 → 從第一欄畫起')
  assert.equal(bar.span, 3, '10-06 到 10-08 共三天')
  assert.equal(bar.continuesLeft, true)
  assert.equal(bar.continuesRight, false)
})

test('barsForWeek 排除不重疊的事件', () => {
  assert.equal(barsForWeek([{ id: 'b', start: '2025-11-01', end: '2025-11-01' }], week).length, 0)
})

test('barsForWeek 單日事件 span 為 1', () => {
  const [bar] = barsForWeek([{ id: 'c', start: '2025-10-07', end: '2025-10-07' }], week)
  assert.equal(bar.colStart, 2)
  assert.equal(bar.span, 1)
})

test('assignLanes 重疊事件分到不同層', () => {
  const { placed, laneCount } = assignLanes([
    { id: '報名', start: '2025-10-01', end: '2025-10-08' },
    { id: '審查', start: '2025-10-01', end: '2025-10-09' },
  ])
  assert.deepEqual(placed.map((p) => p.lane), [0, 1])
  assert.equal(laneCount, 2)
})

test('assignLanes 不重疊事件共用同一層', () => {
  const { placed, laneCount } = assignLanes([
    { id: 'a', start: '2025-10-01', end: '2025-10-08' },
    { id: 'b', start: '2025-11-07', end: '2025-11-07' },
  ])
  assert.deepEqual(placed.map((p) => p.lane), [0, 0])
  assert.equal(laneCount, 1)
})

test('assignLanes 空陣列 laneCount 至少為 1', () => {
  assert.equal(assignLanes([]).laneCount, 1)
})

test('monthsWithEvents 跳過沒有事件的月份', () => {
  const events = [
    { start: '2025-10-01', end: '2025-10-05' },
    { start: '2026-09-30', end: '2026-10-07' },
  ]
  assert.deepEqual(
    monthsWithEvents(events, '2025-10-01', '2026-10-07').map((m) => `${m.year}-${m.month + 1}`),
    ['2025-10', '2026-9', '2026-10'],
  )
})
