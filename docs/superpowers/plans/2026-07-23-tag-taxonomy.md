# 標籤分類體系首版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 COMPASS 加入種子受控詞彙（`src/tags.json`）與查詢擴展層，讓研究領域查詢具備同義詞折疊與階層擴展，教授資料維持不動。

**Architecture:** 純函式 `buildTagIndex`（建索引）與 `expandArea`（展開）放在可測的 `.mjs`；`src/tags.js` 為 Vite 載入層（import tags.json 並建索引）；`filterProfessors` 改為 taxonomy-aware 且向後相容；UI 熱門領域面板升級為兩層分類樹。

**Tech Stack:** Vite 6、React 19、純 CSS、Node 內建 `node:test`。

## Global Constraints

- 相依套件僅限 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`，不得新增其他套件
- 教授資料檔 `src/data/*.json` **完全不改**（tags 是查詢時的映射層）
- `src/tags.json` 節點僅三欄：`name`（canonical 中文、全表唯一）、`parent`（null 或指向存在的 name）、`aliases`（字串陣列）
- 階層只做兩層：頂層大類（`parent: null`）與其子領域
- 字串比對一律正規化：`s.trim().toLowerCase()`
- UI 一律繁體中文
- 純邏輯放 `.mjs` 並有 `node:test` 測試；`.js` 載入層不寫單元測試（比照現有 `data.js`）
- commit 訊息結尾加 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: 標籤索引 `buildTagIndex`

**Files:**
- Create: `src/tag-index.mjs`, `src/tag-index.test.mjs`

**Interfaces:**
- Produces: `normalize(s)` → `string`（`s.trim().toLowerCase()`）；`buildTagIndex(tags)` → `{ byName, children, aliasToCanonical, roots }`：
  - `byName`: `Map<canonicalName, node>`（node = `{name, parent, aliases}`）
  - `children`: `Map<canonicalName, string[]>`（子節點 name 陣列，依 tags 出現順序）
  - `aliasToCanonical`: `Map<normalizedString, canonicalName>`（含每個 name 自身與所有 alias）
  - `roots`: `string[]`（`parent === null` 的 name，依 tags 出現順序）

- [ ] **Step 1: 寫失敗測試 `src/tag-index.test.mjs`**

```js
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
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test src/tag-index.test.mjs`
Expected: FAIL，`Cannot find module ... tag-index.mjs`

- [ ] **Step 3: 寫入 `src/tag-index.mjs`**

```js
export const normalize = (s) => s.trim().toLowerCase()

export function buildTagIndex(tags) {
  const byName = new Map()
  const children = new Map()
  const aliasToCanonical = new Map()
  const roots = []

  for (const node of tags) {
    byName.set(node.name, node)
    if (node.parent === null) roots.push(node.name)
  }
  for (const node of tags) {
    aliasToCanonical.set(normalize(node.name), node.name)
    for (const a of node.aliases) aliasToCanonical.set(normalize(a), node.name)
    if (node.parent !== null) {
      if (!children.has(node.parent)) children.set(node.parent, [])
      children.get(node.parent).push(node.name)
    }
  }
  return { byName, children, aliasToCanonical, roots }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test src/tag-index.test.mjs`
Expected: 5 passed。

- [ ] **Step 5: Commit**

```bash
git add src/tag-index.mjs src/tag-index.test.mjs
git commit -m "feat: 標籤索引 buildTagIndex（含測試）"
```

---

### Task 2: 查詢擴展 `expandArea` 與 taxonomy-aware 篩選

**Files:**
- Modify: `src/filter.mjs`
- Modify: `src/filter.test.mjs`（附加測試，保留現有 7 個）

**Interfaces:**
- Consumes: Task 1 的 `normalize`、`buildTagIndex` 產出的 index 形狀。
- Produces:
  - `expandArea(term, index)` → `Set<string>`（正規化字串集合）。無 index 或 term 不在詞彙表 → `new Set([normalize(term)])`；命中 → 該 canonical 子樹（含自身與所有後代）之每個 name 與其所有 alias 的正規化字串。
  - `filterProfessors(professors, { query, schools, deptTypes, areas, tagIndex } = {})`：新增選填 `tagIndex`。`areas` 比對改為：每個選定 term 各自 `expandArea(term, tagIndex)`，教授只要有任一 raw area 正規化後 ∈ 該集合即滿足此 term；多 term 之間 AND。其餘條件不變。

- [ ] **Step 1: 附加失敗測試到 `src/filter.test.mjs`**（接在檔案末端）

```js
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
```

- [ ] **Step 2: 執行測試確認新測試失敗**

Run: `node --test src/filter.test.mjs`
Expected: FAIL，`expandArea is not a function`（或 import 失敗）。現有 7 個仍應通過。

- [ ] **Step 3: 改寫 `src/filter.mjs`**

```js
import { normalize } from './tag-index.mjs'

export function expandArea(term, index) {
  if (!index) return new Set([normalize(term)])
  const canon = index.aliasToCanonical.get(normalize(term))
  if (!canon) return new Set([normalize(term)])
  const out = new Set()
  const stack = [canon]
  while (stack.length) {
    const name = stack.pop()
    const node = index.byName.get(name)
    out.add(normalize(node.name))
    for (const a of node.aliases) out.add(normalize(a))
    for (const c of index.children.get(name) ?? []) stack.push(c)
  }
  return out
}

export function filterProfessors(
  professors,
  { query = '', schools = [], deptTypes = [], areas = [], tagIndex } = {},
) {
  const q = query.trim().toLowerCase()
  return professors.filter((p) => {
    if (schools.length && !schools.includes(p.school)) return false
    if (deptTypes.length && !deptTypes.includes(p.deptType)) return false
    if (areas.length) {
      const normAreas = p.areas.map(normalize)
      const ok = areas.every((a) => {
        const set = expandArea(a, tagIndex)
        return normAreas.some((na) => set.has(na))
      })
      if (!ok) return false
    }
    if (q) {
      const hay = [p.name, p.lab, p.dept, p.highlights, p.notes, ...p.areas].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
```

- [ ] **Step 4: 執行測試確認全通過**

Run: `node --test src/filter.test.mjs`
Expected: 14 passed（原 7 ＋ 新 7）。

- [ ] **Step 5: Commit**

```bash
git add src/filter.mjs src/filter.test.mjs
git commit -m "feat: expandArea 查詢擴展與 taxonomy-aware 篩選"
```

---

### Task 3: 種子詞彙 `tags.json`、載入層與驗證

**Files:**
- Create: `src/tags.json`, `src/tags.js`
- Modify: `scripts/validate.mjs`

**Interfaces:**
- Consumes: Task 1 的 `buildTagIndex`。
- Produces: `src/tags.js` export `tags`（原始陣列）與 `tagIndex`（`buildTagIndex(tags)` 結果），供 UI 與篩選使用。

**內容建置規則（本任務的資料判斷部分）：**
- 目標：`src/data/*.json` 中出現次數 **≥5** 的每個領域字串，都必須是 `tags.json` 裡某節點的 `name` 或某節點的 `alias`（覆蓋率 100%，Step 4 會驗）。
- 頂層大類（`parent: null`）用這組（可依內容微調）：人工智慧、資訊安全、網路與通訊、系統與硬體、資料與資料庫、多媒體與視覺、軟體工程、人機互動、資訊管理、計算理論、生醫資訊。
- 同義詞歸併：中英文與縮寫寫進同一節點的 `aliases`（機器學習←machine learning/ML；智慧物聯網←AIoT；人工智慧←AI）。判斷不確定時，寧可各自獨立成節點也不要錯併。
- 只做兩層：語意上的細分領域掛到最貼近的大類下當子節點；大類本身若也是常見標記（如「人工智慧」137 次）就同時是可被選取的節點。

- [ ] **Step 1: 取得 ≥5 次領域清單（建置參考，不入 repo）**

Run:
```bash
python3 -c "
import json,glob
from collections import Counter
c=Counter()
for f in glob.glob('src/data/*.json'):
    for p in json.load(open(f))['professors']:
        for a in p['areas']: c[a.strip()]+=1
for a,v in sorted(c.items(), key=lambda x:-x[1]):
    if v>=5: print(v,a)
"
```
Expected: 印出約 143 行（次數 + 領域），作為建置 tags.json 的依據。

- [ ] **Step 2: 寫入 `src/tags.json`**

以 Step 1 清單為準，建立涵蓋全部 ≥5 領域的詞彙表。以下為**起始骨架**（頂層大類 + 資訊安全子樹範例），實作時須補齊其餘大類與所有 ≥5 領域：

```json
[
  { "name": "人工智慧", "parent": null, "aliases": ["AI", "artificial intelligence"] },
  { "name": "機器學習", "parent": "人工智慧", "aliases": ["machine learning", "ML"] },
  { "name": "深度學習", "parent": "人工智慧", "aliases": ["deep learning"] },
  { "name": "類神經網路", "parent": "人工智慧", "aliases": ["neural network", "neural networks"] },
  { "name": "自然語言處理", "parent": "人工智慧", "aliases": ["NLP", "natural language processing"] },
  { "name": "人工智慧應用", "parent": "人工智慧", "aliases": [] },
  { "name": "資訊安全", "parent": null, "aliases": ["資安", "cybersecurity", "information security"] },
  { "name": "網頁安全", "parent": "資訊安全", "aliases": ["web security"] },
  { "name": "網路安全", "parent": "資訊安全", "aliases": ["network security"] },
  { "name": "密碼學", "parent": "資訊安全", "aliases": ["cryptography"] },
  { "name": "系統安全", "parent": "資訊安全", "aliases": ["system security"] },
  { "name": "多媒體與視覺", "parent": null, "aliases": [] },
  { "name": "電腦視覺", "parent": "多媒體與視覺", "aliases": ["computer vision", "CV"] },
  { "name": "影像處理", "parent": "多媒體與視覺", "aliases": ["image processing"] },
  { "name": "數位影像處理", "parent": "多媒體與視覺", "aliases": [] },
  { "name": "電腦圖學", "parent": "多媒體與視覺", "aliases": ["computer graphics"] },
  { "name": "虛擬實境", "parent": "多媒體與視覺", "aliases": ["VR", "virtual reality"] },
  { "name": "網路與通訊", "parent": null, "aliases": [] },
  { "name": "物聯網", "parent": "網路與通訊", "aliases": ["IoT", "internet of things"] },
  { "name": "智慧物聯網", "parent": "網路與通訊", "aliases": ["AIoT"] },
  { "name": "無線網路", "parent": "網路與通訊", "aliases": ["wireless network"] },
  { "name": "無線通訊", "parent": "網路與通訊", "aliases": ["wireless communication"] },
  { "name": "電腦網路", "parent": "網路與通訊", "aliases": ["computer network"] },
  { "name": "資料與資料庫", "parent": null, "aliases": [] },
  { "name": "資料探勘", "parent": "資料與資料庫", "aliases": ["data mining"] },
  { "name": "大數據分析", "parent": "資料與資料庫", "aliases": ["big data"] },
  { "name": "資料科學", "parent": "資料與資料庫", "aliases": ["data science"] },
  { "name": "系統與硬體", "parent": null, "aliases": [] },
  { "name": "嵌入式系統", "parent": "系統與硬體", "aliases": ["embedded system", "embedded systems"] },
  { "name": "分散式系統", "parent": "系統與硬體", "aliases": ["distributed system", "distributed systems"] },
  { "name": "雲端運算", "parent": "系統與硬體", "aliases": ["cloud computing", "雲端計算"] },
  { "name": "數位訊號處理", "parent": "系統與硬體", "aliases": ["DSP", "訊號處理", "digital signal processing"] },
  { "name": "軟體工程", "parent": null, "aliases": ["software engineering"] },
  { "name": "人機互動", "parent": null, "aliases": ["HCI", "human computer interaction"] },
  { "name": "資訊管理", "parent": null, "aliases": [] },
  { "name": "電子商務", "parent": "資訊管理", "aliases": ["e-commerce", "電子商務(EC)"] },
  { "name": "供應鏈管理", "parent": "資訊管理", "aliases": ["supply chain management"] },
  { "name": "金融科技", "parent": "資訊管理", "aliases": ["fintech"] },
  { "name": "數位學習", "parent": "資訊管理", "aliases": ["e-learning"] },
  { "name": "區塊鏈", "parent": "資訊管理", "aliases": ["blockchain"] },
  { "name": "計算理論", "parent": null, "aliases": [] },
  { "name": "演算法", "parent": "計算理論", "aliases": ["algorithm", "algorithms"] },
  { "name": "生醫資訊", "parent": null, "aliases": ["生物資訊", "bioinformatics"] },
  { "name": "多媒體系統", "parent": "多媒體與視覺", "aliases": [] }
]
```

補齊時：把 Step 1 清單裡尚未涵蓋的每個 ≥5 領域，歸到最貼近的大類下新增子節點，或作為既有節點的 alias。

- [ ] **Step 3: 寫入 `src/tags.js`**

```js
import tags from './tags.json'
import { buildTagIndex } from './tag-index.mjs'

export { tags }
export const tagIndex = buildTagIndex(tags)
```

- [ ] **Step 4: 在 `scripts/validate.mjs` 末端（`if (errors)` 之前）加入 tags.json 驗證**

```js
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
  const norm = (s) => s.trim().toLowerCase()
  const seenAlias = new Map() // normalized -> 來源
  for (const n of tags) {
    if (typeof n.name !== 'string' || !n.name) terr('有節點缺 name')
    if (names.has(n.name)) terr(`name 重複「${n.name}」`)
    names.add(n.name)
    if (!Array.isArray(n.aliases)) terr(`${n.name}: aliases 須為陣列`)
    if (n.parent !== null && typeof n.parent !== 'string') terr(`${n.name}: parent 須為 null 或字串`)
  }
  for (const n of tags) {
    if (n.parent !== null && !names.has(n.parent)) terr(`${n.name}: parent「${n.parent}」不存在`)
    // 別名唯一、且不與任何 name 衝突
    for (const a of n.aliases ?? []) {
      const key = norm(a)
      if (names.has(a) && a !== n.name) terr(`${n.name}: alias「${a}」與某 name 衝突`)
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
```

- [ ] **Step 5: 驗證覆蓋率（≥5 領域全數入表）**

Run:
```bash
python3 -c "
import json,glob
from collections import Counter
c=Counter()
for f in glob.glob('src/data/*.json'):
    for p in json.load(open(f))['professors']:
        for a in p['areas']: c[a.strip()]+=1
tags=json.load(open('src/tags.json'))
vocab=set()
for n in tags:
    vocab.add(n['name'].strip().lower())
    for a in n['aliases']: vocab.add(a.strip().lower())
missing=[a for a,v in c.items() if v>=5 and a.strip().lower() not in vocab]
print('未涵蓋的 >=5 領域:', len(missing))
for m in missing: print(' ', c[m], m)
"
```
Expected: `未涵蓋的 >=5 領域: 0`。若非 0，回 Step 2 補齊。

- [ ] **Step 6: 驗證與 build**

Run: `npm run validate && node --test src/tag-index.test.mjs src/filter.test.mjs && npm run build`
Expected: 驗證通過、14 tests passed、build 成功。

- [ ] **Step 7: Commit**

```bash
git add src/tags.json src/tags.js scripts/validate.mjs
git commit -m "feat: 種子受控詞彙 tags.json、載入層與驗證"
```

---

### Task 4: 分類樹 UI

**Files:**
- Modify: `src/ProfessorSearch.jsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: Task 3 的 `src/tags.js`（`tags`、`tagIndex`）；Task 2 的 taxonomy-aware `filterProfessors`（`tagIndex` 選項）。

- [ ] **Step 1: 改寫 `src/ProfessorSearch.jsx`**

將檔案頂部 import 與 `TOP_AREAS` 區塊、`filterProfessors` 呼叫、熱門領域面板替換如下；其餘（搜尋框、學校/系所篩選、最愛、卡片列表）維持不變。

import 區塊改為：
```jsx
import { useMemo, useState } from 'react'
import { professors, schools } from './data.js'
import { tags, tagIndex } from './tags.js'
import { filterProfessors } from './filter.mjs'
```

刪除 `TOP_AREAS` 整段（改用 tags 分類樹）。在 `toggle`／`profId` 之後加入：
```jsx
const ROOTS = tags.filter((t) => t.parent === null)
const childrenOf = (name) => tags.filter((t) => t.parent === name)
```

`results` 的 `filterProfessors` 呼叫加入 `tagIndex`：
```jsx
  const results = useMemo(
    () =>
      filterProfessors(professors, {
        query,
        schools: selSchools,
        deptTypes: selTypes,
        areas: selAreas,
        tagIndex,
      }).filter((p) => (favOnly ? favs.has(profId(p)) : true)),
    [query, selSchools, selTypes, selAreas, favOnly, favs],
  )
```

把原本 `<details className="top-areas">…</details>` 整段替換為分類樹：
```jsx
        <details className="tag-tree">
          <summary>研究領域分類</summary>
          {ROOTS.map((root) => (
            <div key={root.name} className="tag-group">
              <button
                type="button"
                className={selAreas.includes(root.name) ? 'tag on' : 'tag cat'}
                aria-pressed={selAreas.includes(root.name)}
                onClick={() => setSelAreas(toggle(selAreas, root.name))}
              >
                {root.name}
              </button>
              <div className="tag-children">
                {childrenOf(root.name).map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    className={selAreas.includes(c.name) ? 'tag on' : 'tag'}
                    aria-pressed={selAreas.includes(c.name)}
                    onClick={() => setSelAreas(toggle(selAreas, c.name))}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </details>
```

- [ ] **Step 2: 在 `src/style.css` 的 `.top-areas` 規則後加入分類樹樣式**

```css
.tag-tree {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
}

.tag-tree summary { font-size: 0.85rem; color: var(--muted); cursor: pointer; }

.tag-group { margin-top: 10px; }

.tag-children { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 0 12px; }

.tag.cat { font-weight: 600; }
```

- [ ] **Step 3: 測試與 build**

Run: `node --test src/filter.test.mjs && npm run build`
Expected: tests passed、build 成功。

- [ ] **Step 4: 瀏覽器驗證**

啟動 dev server，在「教授查詢」分頁：
- 展開「研究領域分類」，頂層大類與其子領域顯示為兩層
- 點大類「資訊安全」→ 結果數下降、且包含只標「網頁安全」或「密碼學」的教授
- 點子類「密碼學」→ 只剩標密碼學者，不含其他資安子類
- 搜尋框輸入英文別名（若資料有）如 machine learning → 命中對應中文標記教授（經由 hay 全文，非必然；主要驗證分類點選）
- console 無錯誤

Expected: 上述互動正確。

- [ ] **Step 5: Commit**

```bash
git add src/ProfessorSearch.jsx src/style.css
git commit -m "feat: 研究領域分類樹 UI（taxonomy-aware 篩選）"
```

---

### Task 5: README 更新與 PR

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README TODO**

把標籤分類體系那一項由 `- [ ]` 改為 `- [x]`，並在其下新增後續項：
```markdown
- [x] 研究領域標籤分類體系（首版）：受控詞彙 `src/tags.json`、查詢擴展（同義詞折疊＋上位擴展）、分類樹 UI
- [ ] 標籤體系擴充：長尾字串分類、related 關聯推薦、facet 多分面
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: 標籤分類體系首版標記完成"
```

- [ ] **Step 3: 推分支並開 PR**

```bash
git push -u origin feat/tag-taxonomy
gh pr create --base master --title "feat: 研究領域標籤分類體系（首版）" --body "$(cat <<'EOF'
## 摘要
為 COMPASS 加入種子受控詞彙與查詢擴展層：選「資訊安全」自動涵蓋網頁安全／密碼學等子類與中英文同義詞，選子類不上擴，長尾字串維持精確比對。教授資料未改。

## 內容
- `src/tags.json` 受控詞彙（≥5 次領域＋大類＋同義詞）
- `src/tag-index.mjs` `buildTagIndex`、`src/filter.mjs` `expandArea` 與 taxonomy-aware 篩選
- 「研究領域分類」兩層分類樹 UI
- tags.json 驗證與 expandArea 測試

## 驗證
- `npm run validate`、`node --test src/`（14 tests）、`npm run build` 皆通過
- 瀏覽器實測分類點選、上擴/不下擴、同義詞折疊

設計文件：docs/superpowers/specs/2026-07-23-tag-taxonomy-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR 建立成功，印出 PR URL。

- [ ] **Step 4: 回報 PR URL 給使用者**
