import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalize, buildTagIndex } from './tag-index.mjs'

const TAGS = [
  { name: '人工智慧', parent: null, aliases: ['AI', 'artificial intelligence'] },
  { name: '機器學習', parent: '人工智慧', aliases: ['machine learning', 'ML'] },
  { name: '資訊安全', parent: null, aliases: ['資安', 'cybersecurity'] },
  { name: '網頁安全', parent: '資訊安全', aliases: ['web security'] },
  { name: '密碼學', parent: '資訊安全', aliases: ['cryptography'] },
]

test('normalize 去空白轉小寫', () => {
  assert.equal(normalize('  Machine Learning '), 'machine learning')
})

test('roots 只含頂層且保序', () => {
  const idx = buildTagIndex(TAGS)
  assert.deepEqual(idx.roots, ['人工智慧', '資訊安全'])
})

test('children 對應父節點', () => {
  const idx = buildTagIndex(TAGS)
  assert.deepEqual(idx.children.get('資訊安全'), ['網頁安全', '密碼學'])
  assert.deepEqual(idx.children.get('機器學習') ?? [], [])
})

test('aliasToCanonical 含 name 自身與別名（正規化）', () => {
  const idx = buildTagIndex(TAGS)
  assert.equal(idx.aliasToCanonical.get('機器學習'), '機器學習')
  assert.equal(idx.aliasToCanonical.get('machine learning'), '機器學習')
  assert.equal(idx.aliasToCanonical.get('ml'), '機器學習')
  assert.equal(idx.aliasToCanonical.get('ai'), '人工智慧')
})

test('byName 可取回節點', () => {
  const idx = buildTagIndex(TAGS)
  assert.equal(idx.byName.get('網頁安全').parent, '資訊安全')
})
