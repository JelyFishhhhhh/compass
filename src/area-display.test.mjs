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

// ── 長尾對照表 ──
const MAP = {
  'Formal Verification': { zh: '形式化驗證', en: 'Formal Verification' },
  '網宇實體系統': { zh: '網宇實體系統', en: 'Cyber-Physical Systems' },
}

test('長尾英文在中文模式顯示中譯', () => {
  assert.equal(displayArea('Formal Verification', IDX, 'zh', MAP), '形式化驗證')
})

test('長尾中文在英文模式顯示英譯', () => {
  assert.equal(displayArea('網宇實體系統', IDX, 'en', MAP), 'Cyber-Physical Systems')
})

test('對照表查無仍原樣顯示', () => {
  assert.equal(displayArea('某未收錄領域', IDX, 'en', MAP), '某未收錄領域')
})

test('受控詞彙優先於長尾對照表', () => {
  const map = { '機器學習': { zh: '錯誤', en: 'Wrong' } }
  assert.equal(displayArea('機器學習', IDX, 'en', map), 'Machine Learning')
})
