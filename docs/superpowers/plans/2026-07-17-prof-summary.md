# 教授查詢網站實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立台灣國立大學資訊領域（資工／偏所／資管／電機資訊組）教授資料查詢網站，並分批收集所有國立大學的教授資料。

**Architecture:** Vite + React SPA，無後端；一校一 JSON 放在 `src/data/`，以 `import.meta.glob` 打包進 bundle。篩選邏輯抽成純函式（`node:test` 可測）。資料由瀏覽器逐校收集。

**Tech Stack:** Vite 6、React 19、純 CSS、Node 內建 `node:test`（不加測試框架）。

## Global Constraints

- 相依套件僅限 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`，不得新增其他套件
- `deptType` 僅允許四值：`資工`、`偏所`、`資管`、`電機`
- 教授欄位固定：`name`、`title`、`dept`、`deptType`、`areas`（陣列）、`lab`、`website`、`email`、`highlights`、`notes`；查無資料留空字串／空陣列，不臆測
- 不收兼任、名譽、退休教授
- UI 一律繁體中文
- 每批資料收集後必須通過 `npm run validate`

---

### Task 1: 專案骨架

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/style.css`, `.gitignore`

**Interfaces:**
- Produces: 可執行的 Vite React 專案；`npm run dev` / `npm run build` / `npm test` / `npm run validate` 四個 script。

- [ ] **Step 1: 寫入 `package.json`**

```json
{
  "name": "cse-prof-summary",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test src/",
    "validate": "node scripts/validate.mjs"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "vite": "^6.3.5"
  }
}
```

- [ ] **Step 2: 寫入 `vite.config.js`**（`base: './'` 讓 build 產物放任何路徑都能開，含 GitHub Pages）

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
})
```

- [ ] **Step 3: 寫入 `index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>台灣國立大學資訊領域教授查詢</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 寫入 `src/main.jsx`**

```jsx
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'

createRoot(document.getElementById('root')).render(<App />)
```

- [ ] **Step 5: 寫入暫時版 `src/App.jsx`（Task 4 會全面改寫）**

```jsx
export default function App() {
  return <h1>台灣國立大學資訊領域教授查詢</h1>
}
```

- [ ] **Step 6: 寫入空的 `src/style.css` 與 `.gitignore`**

`.gitignore`:

```
node_modules/
dist/
```

- [ ] **Step 7: 安裝並驗證 build**

Run: `npm install && npm run build`
Expected: `vite build` 成功，產出 `dist/`，無錯誤。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Vite + React 專案骨架"
```

---

### Task 2: 資料驗證 script 與範例資料

**Files:**
- Create: `scripts/validate.mjs`, `src/data/sample.json`

**Interfaces:**
- Produces: `npm run validate` 檢查 `src/data/*.json` 全部檔案；資料格式如 spec（school/schoolFull/professors[]）。sample.json 供 UI 開發用，Task 5 收到真實資料後刪除。

- [ ] **Step 1: 寫入範例資料 `src/data/sample.json`（虛構，僅供開發）**

```json
{
  "school": "範例大學",
  "schoolFull": "國立範例大學",
  "professors": [
    {
      "name": "王小明",
      "title": "教授",
      "dept": "資訊工程學系",
      "deptType": "資工",
      "areas": ["機器學習", "電腦視覺"],
      "lab": "智慧視覺實驗室",
      "website": "https://example.edu.tw/~wang",
      "email": "wang@example.edu.tw",
      "highlights": "近年專注於弱監督學習與醫療影像分析。",
      "notes": ""
    },
    {
      "name": "李美華",
      "title": "副教授",
      "dept": "資訊管理研究所",
      "deptType": "資管",
      "areas": ["資料探勘", "推薦系統"],
      "lab": "",
      "website": "",
      "email": "lee@example.edu.tw",
      "highlights": "",
      "notes": "學長推薦，收生名額多"
    }
  ]
}
```

- [ ] **Step 2: 寫入 `scripts/validate.mjs`**

```js
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
  }
}

if (errors) {
  console.error(`✗ 共 ${errors} 個錯誤`)
  process.exit(1)
}
console.log('✓ 所有資料檔通過驗證')
```

- [ ] **Step 3: 驗證 script 能抓到錯誤（負面測試）**

Run: `node -e "require('fs').writeFileSync('src/data/_bad.json', JSON.stringify({school:'x'}))" && npm run validate; rm src/data/_bad.json`
Expected: 輸出 `_bad.json: 缺 schoolFull`、`professors 須為非空陣列`，exit code 非 0，最後刪除 `_bad.json`。

- [ ] **Step 4: 驗證合法資料通過**

Run: `npm run validate`
Expected: `✓ 所有資料檔通過驗證`

- [ ] **Step 5: Commit**

```bash
git add scripts/validate.mjs src/data/sample.json
git commit -m "feat: 資料驗證 script 與範例資料"
```

---

### Task 3: 篩選邏輯與資料載入

**Files:**
- Create: `src/filter.mjs`, `src/filter.test.mjs`, `src/data.js`

**Interfaces:**
- Produces:
  - `filterProfessors(professors, {query, schools, deptTypes, areas})` → 過濾後陣列。空條件＝不過濾；`areas` 為 AND；`query` 為不分大小寫子字串，比對 name/lab/dept/highlights/notes/areas。
  - `src/data.js` export `schools`（各校物件陣列，依校名排序）與 `professors`（攤平陣列，每筆附上 `school`/`schoolFull`）。Task 4 的 App 使用這兩個 export。

- [ ] **Step 1: 寫入失敗測試 `src/filter.test.mjs`**

```js
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
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm test`
Expected: FAIL，`Cannot find module ... filter.mjs`

- [ ] **Step 3: 寫入 `src/filter.mjs`**

```js
export function filterProfessors(professors, { query = '', schools = [], deptTypes = [], areas = [] } = {}) {
  const q = query.trim().toLowerCase()
  return professors.filter((p) => {
    if (schools.length && !schools.includes(p.school)) return false
    if (deptTypes.length && !deptTypes.includes(p.deptType)) return false
    if (areas.length && !areas.every((a) => p.areas.includes(a))) return false
    if (q) {
      const hay = [p.name, p.lab, p.dept, p.highlights, p.notes, ...p.areas].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test`
Expected: 7 passed。

- [ ] **Step 5: 寫入 `src/data.js`**

```js
const modules = import.meta.glob('./data/*.json', { eager: true })

export const schools = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => a.school.localeCompare(b.school, 'zh-Hant'))

export const professors = schools.flatMap((s) =>
  s.professors.map((p) => ({ ...p, school: s.school, schoolFull: s.schoolFull })),
)
```

- [ ] **Step 6: 確認 build 可打包資料模組**

Run: `npm run build`
Expected: 成功（`data.js` 尚未被 App 引用也應可 build）。

- [ ] **Step 7: Commit**

```bash
git add src/filter.mjs src/filter.test.mjs src/data.js
git commit -m "feat: 篩選邏輯（含測試）與資料載入模組"
```

---

### Task 4: 查詢 UI

**Files:**
- Modify: `src/App.jsx`（整檔改寫）, `src/style.css`（整檔改寫）

**Interfaces:**
- Consumes: `src/data.js` 的 `schools`、`professors`；`src/filter.mjs` 的 `filterProfessors`。

- [ ] **Step 1: 改寫 `src/App.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { professors, schools } from './data.js'
import { filterProfessors } from './filter.mjs'

const DEPT_TYPES = ['資工', '偏所', '資管', '電機']

const toggle = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

export default function App() {
  const [query, setQuery] = useState('')
  const [selSchools, setSelSchools] = useState([])
  const [selTypes, setSelTypes] = useState([])
  const [selAreas, setSelAreas] = useState([])

  const results = useMemo(
    () => filterProfessors(professors, { query, schools: selSchools, deptTypes: selTypes, areas: selAreas }),
    [query, selSchools, selTypes, selAreas],
  )

  return (
    <div className="app">
      <header>
        <h1>台灣國立大學資訊領域教授查詢</h1>
        <input
          type="search"
          placeholder="搜尋姓名、實驗室、研究領域…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="filters">
        <fieldset>
          <legend>學校</legend>
          {schools.map((s) => (
            <label key={s.school}>
              <input
                type="checkbox"
                checked={selSchools.includes(s.school)}
                onChange={() => setSelSchools(toggle(selSchools, s.school))}
              />
              {s.school}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>系所類型</legend>
          {DEPT_TYPES.map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                checked={selTypes.includes(t)}
                onChange={() => setSelTypes(toggle(selTypes, t))}
              />
              {t}
            </label>
          ))}
        </fieldset>
        {selAreas.length > 0 && (
          <div className="active-areas">
            領域篩選：
            {selAreas.map((a) => (
              <button key={a} onClick={() => setSelAreas(toggle(selAreas, a))}>
                {a} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="count">
        {results.length} / {professors.length} 位教授
      </p>

      <ul className="cards">
        {results.map((p) => (
          <li key={`${p.school}-${p.dept}-${p.name}`} className="card">
            <div className="card-head">
              <strong>{p.name}</strong>
              <span className="title">{p.title}</span>
              <span className="school">
                {p.school}・{p.dept}
              </span>
            </div>
            {p.areas.length > 0 && (
              <div className="tags">
                {p.areas.map((a) => (
                  <button
                    key={a}
                    className={selAreas.includes(a) ? 'tag on' : 'tag'}
                    onClick={() => setSelAreas(toggle(selAreas, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            {p.lab && <p className="lab">{p.lab}</p>}
            {p.highlights && <p className="hl">{p.highlights}</p>}
            {p.notes && <p className="notes">📝 {p.notes}</p>}
            <p className="links">
              {p.website && (
                <a href={p.website} target="_blank" rel="noreferrer">
                  個人網頁
                </a>
              )}
              {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
            </p>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="empty">沒有符合條件的教授</p>}
    </div>
  )
}
```

- [ ] **Step 2: 改寫 `src/style.css`**

```css
* { box-sizing: border-box; margin: 0; }

body {
  font-family: 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif;
  background: #f5f6f8;
  color: #1a1a2e;
  line-height: 1.6;
}

.app { max-width: 960px; margin: 0 auto; padding: 24px 16px; }

header h1 { font-size: 1.5rem; margin-bottom: 12px; }

header input[type='search'] {
  width: 100%;
  padding: 10px 14px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.filters { margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }

fieldset {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

legend { font-size: 0.85rem; color: #666; padding: 0 4px; }

fieldset label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }

.active-areas { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.active-areas button {
  border: none;
  background: #1a1a2e;
  color: #fff;
  border-radius: 999px;
  padding: 2px 10px;
  cursor: pointer;
}

.count { color: #666; font-size: 0.9rem; margin-bottom: 8px; }

.cards { list-style: none; padding: 0; display: grid; gap: 12px; }

.card {
  background: #fff;
  border: 1px solid #e3e3e8;
  border-radius: 10px;
  padding: 14px 16px;
}

.card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }

.card-head strong { font-size: 1.1rem; }

.card-head .title { color: #666; font-size: 0.9rem; }

.card-head .school { color: #888; font-size: 0.85rem; margin-left: auto; }

.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 4px; }

.tag {
  border: 1px solid #c5c9d6;
  background: #f0f2f7;
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 0.85rem;
  cursor: pointer;
}

.tag.on { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }

.lab { font-size: 0.9rem; color: #444; }

.hl { font-size: 0.9rem; color: #333; margin-top: 4px; }

.notes { font-size: 0.9rem; color: #7a5b00; margin-top: 4px; }

.links { margin-top: 8px; display: flex; gap: 14px; font-size: 0.9rem; }

.links a { color: #2456d6; }

.empty { text-align: center; color: #888; padding: 40px 0; }
```

- [ ] **Step 3: 在瀏覽器驗證**

啟動 dev server（`.claude/launch.json` 設 `npm run dev`，port 5173），用瀏覽器開啟：
- 範例兩位教授顯示為卡片
- 搜尋「小明」只剩一筆；清空恢復
- 勾「資管」只剩李美華
- 點卡片上「機器學習」標籤 → 出現領域篩選 chip、結果過濾；點 ✕ 解除

Expected: 上述互動全部正確，console 無錯誤。

- [ ] **Step 4: 執行全部檢查**

Run: `npm test && npm run validate && npm run build`
Expected: 全部通過。

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/style.css .claude/launch.json
git commit -m "feat: 查詢 UI（搜尋、篩選、卡片列表）"
```

---

### Task 5: 第 1 批資料收集 — 四大

**Files:**
- Create: `src/data/ntu.json`, `src/data/nthu.json`, `src/data/nycu.json`, `src/data/ncku.json`
- Delete: `src/data/sample.json`

**Interfaces:**
- Consumes: Task 2 的資料格式與 validate script。
- Produces: 四大完整教授資料。

收集程序（每校相同）：
1. 用瀏覽器開啟該校各目標系所的官方師資頁（下方起點 URL；若失效改用網頁搜尋「<學校> <系所> 師資」）。
2. 逐位教授記錄欄位；`areas` 取自系所頁的研究領域欄；`highlights` 若系所頁無摘要則點進個人頁摘 1-3 行，找不到留空。
3. 排除兼任／名譽／退休；`deptType` 依系所歸類（電機所僅收計算機、多媒體、通訊網路等資訊相關組教授）。
4. 寫入該校 JSON 後執行 `npm run validate` 修正錯誤。

- [ ] **Step 1: 台大 → `src/data/ntu.json`**（`school`: "台大"，`schoolFull`: "國立臺灣大學"）

目標系所：資訊工程學系（csie.ntu.edu.tw）、資訊網路與多媒體研究所（偏所）、生醫電子與資訊學研究所（偏所）、資訊管理學系（資管）、電機工程學系資訊相關組（電機）。

- [ ] **Step 2: 清大 → `src/data/nthu.json`**（"清大"／"國立清華大學"）

目標系所：資訊工程學系（cs.nthu.edu.tw）、資訊系統與應用研究所（偏所）、資訊安全研究所（偏所）、服務科學研究所（資管，歸類視內容判斷）、電機工程學系資訊相關組（電機）。

- [ ] **Step 3: 陽明交大 → `src/data/nycu.json`**（"陽明交大"／"國立陽明交通大學"）

目標系所：資訊工程學系（cs.nycu.edu.tw，含資科工／資聯網／多媒體各所）、資訊安全研究所（偏所）、數據科學與工程研究所（偏所）、資訊管理研究所（資管）、電機工程學系資訊相關組（電機）。

- [ ] **Step 4: 成大 → `src/data/ncku.json`**（"成大"／"國立成功大學"）

目標系所：資訊工程學系（csie.ncku.edu.tw）、製造資訊與系統研究所（偏所）、資訊管理研究所／工資管（資管）、電機工程學系資訊相關組（電機）。

- [ ] **Step 5: 刪除範例資料並全面驗證**

Run: `rm src/data/sample.json && npm run validate && npm run build`
Expected: 驗證通過、build 成功。瀏覽器抽查：四校出現在學校篩選器、人數合理（每校資工系約 30-50 人）。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "data: 第 1 批（台大、清大、陽明交大、成大）"
```

---

### Task 6: 第 2 批資料收集 — 四中＋台科北科

**Files:**
- Create: `src/data/ncu.json`, `src/data/nsysu.json`, `src/data/nchu.json`, `src/data/ccu.json`, `src/data/ntust.json`, `src/data/ntut.json`

收集程序同 Task 5。

- [ ] **Step 1: 中央 → `ncu.json`**（"中央"／"國立中央大學"）：資訊工程學系、網路學習科技研究所（偏所）、資訊管理學系、電機資訊相關組
- [ ] **Step 2: 中山 → `nsysu.json`**（"中山"／"國立中山大學"）：資訊工程學系、資訊管理學系、電機資訊相關組
- [ ] **Step 3: 中興 → `nchu.json`**（"中興"／"國立中興大學"）：資訊工程學系、資訊管理學系、電機資訊相關組
- [ ] **Step 4: 中正 → `ccu.json`**（"中正"／"國立中正大學"）：資訊工程學系、資訊管理學系、通訊工程學系（偏所）、電機資訊相關組
- [ ] **Step 5: 台科大 → `ntust.json`**（"台科大"／"國立臺灣科技大學"）：資訊工程系、資訊管理系、電機／電子資訊相關組
- [ ] **Step 6: 北科大 → `ntut.json`**（"北科大"／"國立臺北科技大學"）：資訊工程系、資訊與財金管理系（資管）、電機／電子資訊相關組
- [ ] **Step 7: 驗證**

Run: `npm run validate && npm run build`
Expected: 通過。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "data: 第 2 批（中央、中山、中興、中正、台科大、北科大）"
```

---

### Task 7: 第 3 批資料收集 — 其餘國立大學

**Files:**
- Create: 每校一檔，檔名用校名英文縮寫小寫

學校清單（有資工／資管相關系所者；執行時再分 3 個子批次，每子批完成即 validate + commit）：

- 子批 7a（一般大學北部＋綜合）：政大、台師大、台北大學、海大、暨南、東華
- 子批 7b（一般大學中南東部）：宜蘭、聯合、嘉義、高雄、屏東、台東、台南、彰師大、高師大、金門
- 子批 7c（國立科大）：雲科大、高科大、虎尾科大、屏科大、勤益科大、澎湖科大

收集程序同 Task 5；多數學校只有資工系＋資管系，快很多。查無資訊相關系所的學校直接略過並在 commit 訊息註明。

- [ ] **Step 1: 子批 7a 收集＋validate＋commit**（`git commit -m "data: 第 3a 批（政大、台師大、台北大、海大、暨南、東華）"`）
- [ ] **Step 2: 子批 7b 收集＋validate＋commit**（`git commit -m "data: 第 3b 批（宜蘭、聯合、嘉義、高雄、屏東、台東、台南、彰師、高師、金門）"`）
- [ ] **Step 3: 子批 7c 收集＋validate＋commit**（`git commit -m "data: 第 3c 批（雲科、高科、虎尾、屏科、勤益、澎湖）"`）
- [ ] **Step 4: 最終驗證**

Run: `npm test && npm run validate && npm run build`
Expected: 全部通過。瀏覽器抽查總人數與各校篩選。

---

### Task 8: README 與部署說明

**Files:**
- Create: `README.md`

- [ ] **Step 1: 寫入 `README.md`**

```markdown
# 台灣國立大學資訊領域教授查詢

推甄用：整理國立大學資工所、資訊相關偏所、資管所、電機所（資訊相關組）教授資料的查詢網站。

## 開發

    npm install
    npm run dev        # 開發伺服器
    npm test           # 篩選邏輯測試
    npm run validate   # 資料格式驗證
    npm run build      # 產出 dist/

## 更新資料

編輯 `src/data/<school>.json`（一校一檔），欄位格式見
`docs/superpowers/specs/2026-07-17-prof-summary-design.md`，改完跑 `npm run validate`。
個人筆記寫在教授的 `notes` 欄位。

## 部署（GitHub Pages）

1. 建立 GitHub repo 並 push
2. `npm run build` 後將 `dist/` 部署，或於 repo Settings → Pages 選擇 GitHub Actions（Vite 官方 workflow）
3. `vite.config.js` 已設 `base: './'`，不需依 repo 名稱調整
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README 與部署說明"
```
