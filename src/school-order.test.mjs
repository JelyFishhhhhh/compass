import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCHOOL_ORDER, compareSchools } from './school-order.mjs'

test('依志願序排，台大在最前', () => {
  const sorted = ['成大', '台大', '中央', '清大'].sort(compareSchools)
  assert.deepEqual(sorted, ['台大', '清大', '成大', '中央'])
})

test('名單外的學校排最後', () => {
  const sorted = ['某新大學', '台大'].sort(compareSchools)
  assert.deepEqual(sorted, ['台大', '某新大學'])
})

test('兩個名單外的學校依校名排', () => {
  // 用拉丁字母開頭，避免中文排序法（筆劃/拼音）差異影響斷言
  const sorted = ['B大學', 'A大學'].sort(compareSchools)
  assert.deepEqual(sorted, ['A大學', 'B大學'])
})

test('名單無重複', () => {
  assert.equal(new Set(SCHOOL_ORDER).size, SCHOOL_ORDER.length)
})
