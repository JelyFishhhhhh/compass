import { readFileSync, readdirSync } from 'node:fs'

const DEPT_TYPES = ['資工', '偏所', '資管', '電機']
const STR_FIELDS = ['name', 'title', 'dept', 'deptType', 'lab', 'website', 'email', 'highlights', 'notes']

let errors = 0
const dir = new URL('../src/data/', import.meta.url)

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const err = (msg) => {
    console.error(`${file}: ${msg}`)
    errors++
  }
  let data
  try {
    data = JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
  } catch (e) {
    err(`JSON 解析失敗: ${e.message}`)
    continue
  }
  if (!data.school) err('缺 school')
  if (!data.schoolFull) err('缺 schoolFull')
  if (!Array.isArray(data.professors) || data.professors.length === 0) {
    err('professors 須為非空陣列')
    continue
  }
  for (const p of data.professors) {
    const id = p.name || '(無名)'
    for (const k of STR_FIELDS) {
      if (typeof p[k] !== 'string') err(`${id}: ${k} 須為字串`)
    }
    if (!p.name) err('有教授缺 name')
    if (!DEPT_TYPES.includes(p.deptType)) err(`${id}: deptType 不合法「${p.deptType}」`)
    if (!Array.isArray(p.areas)) err(`${id}: areas 須為陣列`)
    if (p.website && !/^https?:\/\//.test(p.website)) err(`${id}: website 須為 http(s) 連結`)
    if (p.email && !p.email.includes('@')) err(`${id}: email 格式錯誤`)
    if (p.labWebsite !== undefined) {
      if (typeof p.labWebsite !== 'string') err(`${id}: labWebsite 須為字串`)
      else if (p.labWebsite && !/^https?:\/\//.test(p.labWebsite)) err(`${id}: labWebsite 須為 http(s) 連結`)
    }
  }
}

// 推甄時程 src/data/schedule/*.json（school × 梯次）
const ISO = /^(\d{4}-\d{2}(-\d{2})?)?$/ // 空字串、YYYY-MM 或 YYYY-MM-DD
const schedDir = new URL('../src/data/schedule/', import.meta.url)
let schedFiles = []
try {
  schedFiles = readdirSync(schedDir).filter((f) => f.endsWith('.json'))
} catch {
  // ponytail: schedule 目錄可選，不存在就跳過
}
for (const file of schedFiles) {
  const err = (msg) => {
    console.error(`schedule/${file}: ${msg}`)
    errors++
  }
  let data
  try {
    data = JSON.parse(readFileSync(new URL(file, schedDir), 'utf8'))
  } catch (e) {
    err(`JSON 解析失敗: ${e.message}`)
    continue
  }
  if (!data.school) err('缺 school')
  if (!data.schoolFull) err('缺 schoolFull')
  if (!Array.isArray(data.rounds)) {
    err('rounds 須為陣列')
    continue
  }
  for (const r of data.rounds) {
    const id = r.round || '(無梯次)'
    if (!r.round) err('有梯次缺 round')
    if (!/^\d{3}$/.test(r.academicYear ?? '')) err(`${id}: academicYear 須為三位民國年字串`)
    if (!ISO.test(r.applyStart ?? '')) err(`${id}: applyStart 須為 ISO 日期或空字串`)
    if (!ISO.test(r.applyEnd ?? '')) err(`${id}: applyEnd 須為 ISO 日期或空字串`)
    if (typeof r.isPreviousYear !== 'boolean') err(`${id}: isPreviousYear 須為布林`)
    if (!r.source || !/^https?:\/\//.test(r.source)) err(`${id}: source 須為 http(s) 連結`)
  }
}

// 受控詞彙 src/tags.json
import { existsSync } from 'node:fs'
const tagsUrl = new URL('../src/tags.json', import.meta.url)
if (existsSync(tagsUrl)) {
  const terr = (msg) => {
    console.error(`tags.json: ${msg}`)
    errors++
  }
  let tags
  try {
    tags = JSON.parse(readFileSync(tagsUrl, 'utf8'))
  } catch (e) {
    terr(`JSON 解析失敗: ${e.message}`)
    tags = []
  }
  const names = new Set()
  const normNames = new Set() // 正規化後的 name，供 alias 衝突比對（與 runtime 索引一致）
  const norm = (s) => s.trim().toLowerCase()
  const seenAlias = new Map() // normalized -> 來源
  for (const n of tags) {
    if (typeof n.name !== 'string' || !n.name) terr('有節點缺 name')
    if (names.has(n.name)) terr(`name 重複「${n.name}」`)
    names.add(n.name)
    normNames.add(norm(n.name))
    if (!Array.isArray(n.aliases)) terr(`${n.name}: aliases 須為陣列`)
    if (n.parent !== null && typeof n.parent !== 'string') terr(`${n.name}: parent 須為 null 或字串`)
    if (typeof n.en !== 'string' || !n.en) terr(`${n.name}: 缺英文名稱 en（中英切換需要）`)
  }
  const rootNames = new Set(tags.filter((n) => n.parent === null).map((n) => n.name))
  for (const n of tags) {
    if (n.parent !== null && !names.has(n.parent)) terr(`${n.name}: parent「${n.parent}」不存在`)
    // 只做兩層：非頂層節點的 parent 必須是頂層大類
    if (n.parent !== null && names.has(n.parent) && !rootNames.has(n.parent)) {
      terr(`${n.name}: parent「${n.parent}」非頂層大類（僅允許兩層）`)
    }
    // 別名唯一、且不與任何 name 衝突（比對正規化，與 buildTagIndex 一致）
    for (const a of n.aliases ?? []) {
      const key = norm(a)
      if (normNames.has(key) && key !== norm(n.name)) terr(`${n.name}: alias「${a}」與某 name 衝突`)
      if (seenAlias.has(key)) terr(`alias「${a}」重複（${seenAlias.get(key)} 與 ${n.name}）`)
      seenAlias.set(key, n.name)
    }
  }
  // 無循環：沿 parent 上溯不得回到自身
  const byName = new Map(tags.map((n) => [n.name, n]))
  for (const n of tags) {
    const seen = new Set()
    let cur = n
    while (cur && cur.parent !== null) {
      if (seen.has(cur.name)) {
        terr(`${n.name}: parent 鏈有循環`)
        break
      }
      seen.add(cur.name)
      cur = byName.get(cur.parent)
    }
  }
}

if (errors) {
  console.error(`✗ 共 ${errors} 個錯誤`)
  process.exit(1)
}
console.log('✓ 所有資料檔通過驗證')
