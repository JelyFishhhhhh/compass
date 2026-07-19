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

if (errors) {
  console.error(`✗ 共 ${errors} 個錯誤`)
  process.exit(1)
}
console.log('✓ 所有資料檔通過驗證')
