import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterProfessors } from './filter.mjs'

const profs = [
  { name: '王小明', school: '台大', dept: '資訊工程學系', deptType: '資工', areas: ['機器學習', '電腦視覺'], lab: '智慧視覺實驗室', highlights: '醫療影像', notes: '' },
  { name: '李美華', school: '清大', dept: '資訊管理研究所', deptType: '資管', areas: ['資料探勘'], lab: '', highlights: '', notes: '學長推薦' },
]

test('無條件回傳全部', () => {
  assert.equal(filterProfessors(profs, {}).length, 2)
})

test('關鍵字比對姓名', () => {
  assert.deepEqual(filterProfessors(profs, { query: '小明' }).map((p) => p.name), ['王小明'])
})

test('關鍵字比對 areas 與 notes', () => {
  assert.equal(filterProfessors(profs, { query: '資料探勘' })[0].name, '李美華')
  assert.equal(filterProfessors(profs, { query: '學長' })[0].name, '李美華')
})

test('學校篩選', () => {
  assert.equal(filterProfessors(profs, { schools: ['清大'] })[0].name, '李美華')
})

test('deptType 篩選', () => {
  assert.equal(filterProfessors(profs, { deptTypes: ['資工'] })[0].name, '王小明')
})

test('areas 為 AND 條件', () => {
  assert.equal(filterProfessors(profs, { areas: ['機器學習', '電腦視覺'] }).length, 1)
  assert.equal(filterProfessors(profs, { areas: ['機器學習', '資料探勘'] }).length, 0)
})

test('條件為交集', () => {
  assert.equal(filterProfessors(profs, { query: '王', schools: ['清大'] }).length, 0)
})

// Task 2: expandArea 和 taxonomy-aware 篩選
import { buildTagIndex } from './tag-index.mjs'
import { expandArea } from './filter.mjs'

const TAX = buildTagIndex([
  { name: '資訊安全', parent: null, aliases: ['資安', 'cybersecurity'] },
  { name: '網頁安全', parent: '資訊安全', aliases: ['web security'] },
  { name: '密碼學', parent: '資訊安全', aliases: [] },
  { name: '機器學習', parent: null, aliases: ['machine learning'] },
])

const taxProfs = [
  { name: '甲', school: 'A', dept: 'D', deptType: '資工', areas: ['網頁安全'], lab: '', highlights: '', notes: '' },
  { name: '乙', school: 'A', dept: 'D', deptType: '資工', areas: ['密碼學'], lab: '', highlights: '', notes: '' },
  { name: '丙', school: 'A', dept: 'D', deptType: '資工', areas: ['Machine Learning'], lab: '', highlights: '', notes: '' },
]

test('expandArea 上位含子樹與別名', () => {
  const set = expandArea('資訊安全', TAX)
  assert.ok(set.has('網頁安全'))
  assert.ok(set.has('密碼學'))
  assert.ok(set.has('web security'))
  assert.ok(set.has('cybersecurity'))
})

test('expandArea 子類不上擴', () => {
  const set = expandArea('密碼學', TAX)
  assert.ok(set.has('密碼學'))
  assert.ok(!set.has('網頁安全'))
})

test('expandArea 長尾字串 fallback 為自身', () => {
  assert.deepEqual([...expandArea('某冷門領域', TAX)], ['某冷門領域'])
  assert.deepEqual([...expandArea('某冷門領域', undefined)], ['某冷門領域'])
})

test('選上位類別命中子類教授', () => {
  const r = filterProfessors(taxProfs, { areas: ['資訊安全'], tagIndex: TAX })
  assert.deepEqual(r.map((p) => p.name), ['甲', '乙'])
})

test('選子類不命中兄弟或上位', () => {
  const r = filterProfessors(taxProfs, { areas: ['密碼學'], tagIndex: TAX })
  assert.deepEqual(r.map((p) => p.name), ['乙'])
})

test('同義詞折疊（大小寫不敏感）', () => {
  const r = filterProfessors(taxProfs, { areas: ['機器學習'], tagIndex: TAX })
  assert.deepEqual(r.map((p) => p.name), ['丙'])
})

test('無 tagIndex 時退回精確比對（向後相容）', () => {
  const r = filterProfessors(taxProfs, { areas: ['資訊安全'] })
  assert.equal(r.length, 0)
})

// ── institutes（兼屬偏所）──
const instProfs = [
  { name: '甲', school: 'A', dept: '資訊工程學系', deptType: '資工', areas: [], lab: '', highlights: '', notes: '', institutes: ['資訊網路與多媒體研究所'] },
  { name: '乙', school: 'A', dept: '資訊工程學系', deptType: '資工', areas: [], lab: '', highlights: '', notes: '' },
  { name: '丙', school: 'A', dept: '通訊工程學系', deptType: '偏所', areas: [], lab: '', highlights: '', notes: '' },
]

test('偏所篩選涵蓋合聘於偏所的資工教授', () => {
  const r = filterProfessors(instProfs, { deptTypes: ['偏所'] })
  assert.deepEqual(r.map((p) => p.name), ['甲', '丙'])
})

test('資工篩選仍以主聘為準（不因兼屬偏所而消失）', () => {
  const r = filterProfessors(instProfs, { deptTypes: ['資工'] })
  assert.deepEqual(r.map((p) => p.name), ['甲', '乙'])
})

test('可依特定偏所名稱篩選', () => {
  const r = filterProfessors(instProfs, { institutes: ['資訊網路與多媒體研究所'] })
  assert.deepEqual(r.map((p) => p.name), ['甲'])
})

test('關鍵字可搜到兼屬的偏所名稱', () => {
  const r = filterProfessors(instProfs, { query: '網路與多媒體' })
  assert.deepEqual(r.map((p) => p.name), ['甲'])
})
