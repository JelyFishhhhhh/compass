import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTagIndex } from './tag-index.mjs'
import { canonicalOf, displayArea } from './area-display.mjs'

const IDX = buildTagIndex([
  { name: '人工智慧', en: 'Artificial Intelligence', parent: null, aliases: ['AI'] },
  {
    name: '機器學習',
    en: 'Machine Learning',
    parent: '人工智慧',
    aliases: ['machine learning', 'ML', '機器學習(Machine Learning)'],
  },
  { name: '延展實境', parent: null, aliases: ['XR'] }, // 沒有 en，測 fallback
])

test('英文別名在中文模式顯示為中文 canonical', () => {
  assert.equal(displayArea('Machine Learning', IDX), '機器學習')
  assert.equal(displayArea('ML', IDX), '機器學習')
  assert.equal(displayArea('機器學習(Machine Learning)', IDX), '機器學習')
})

test('中文 canonical 在英文模式顯示為 en', () => {
  assert.equal(displayArea('機器學習', IDX, 'en'), 'Machine Learning')
  assert.equal(displayArea('ML', IDX, 'en'), 'Machine Learning')
})

test('大小寫與空白不影響比對', () => {
  assert.equal(displayArea('  machine LEARNING  ', IDX), '機器學習')
})

test('節點缺 en 時英文模式回中文 canonical', () => {
  assert.equal(displayArea('XR', IDX, 'en'), '延展實境')
})

test('詞彙表外的長尾字串原樣顯示（兩種語言都是）', () => {
  assert.equal(displayArea('Formal Verification', IDX), 'Formal Verification')
  assert.equal(displayArea('某冷門領域', IDX, 'en'), '某冷門領域')
})

test('canonicalOf 找不到回 null、無索引也回 null', () => {
  assert.equal(canonicalOf('不存在', IDX), null)
  assert.equal(canonicalOf('機器學習', undefined), null)
})
