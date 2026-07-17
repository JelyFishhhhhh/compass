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
