# COMPASS 標籤分類體系首版 — 設計文件

日期：2026-07-23
分支：feat/tag-taxonomy
狀態：已核准

## 目的

現況研究領域標籤是各校師資頁抓下的自由字串（folksonomy）：3555 個不重複字串、3011 個只出現一次、前 50 名僅涵蓋 25%、1025 個含英文。導致「網頁安全」「密碼學」不會被「資訊安全」的查詢涵蓋、中英文同義詞分裂（機器學習／Machine Learning、資安／cybersecurity）。

首版目標：建立**種子受控詞彙 + 查詢擴展層**，讓查詢具備同義詞折疊與階層擴展，教授資料維持不動。對應 wiki `wiki/COMPASS/Tag-Taxonomy-Design.md` 的「第一層：規則式 taxonomy」。

## 範圍

**做**：
- `src/tags.json` 受控詞彙，涵蓋出現 ≥5 次的 ~143 個領域 ＋ 8-12 個上位大類 ＋ 中英文同義詞
- `filter.mjs` 查詢時擴展（lookup 層，不改教授資料）
- 「熱門領域」面板升級為兩層分類樹
- tags.json 驗證、expandArea 測試

**不做**（列入後續 TODO）：
- related 關聯推薦、facet 多分面、加權排序（現為 boolean 篩選，不需要）
- 長尾 3000+ 只出現 1 次字串的完整分類
- 教授 areas 欄位重寫

## 資料格式 `src/tags.json`

扁平陣列，每個節點三欄：

```json
[
  { "name": "資訊安全", "parent": null, "aliases": ["資安", "cybersecurity", "information security"] },
  { "name": "網頁安全", "parent": "資訊安全", "aliases": ["web security"] },
  { "name": "密碼學", "parent": "資訊安全", "aliases": ["cryptography"] },
  { "name": "人工智慧", "parent": null, "aliases": ["AI", "artificial intelligence"] },
  { "name": "機器學習", "parent": "人工智慧", "aliases": ["machine learning", "ML"] }
]
```

- `name`：canonical 中文名稱，全表唯一
- `parent`：上位節點的 `name`，或 `null`（頂層大類）。首版只做兩層（頂層大類 + 子領域）
- `aliases`：同義詞（含英文、縮寫、常見異寫），全表唯一、且不與任何 `name` 重複
- 一個節點可同時是「被直接標記的領域」與「上位類別」（如「人工智慧」本身 137 位教授有標，同時是大類）

上位大類草案（8-12 個）：人工智慧、資訊安全、網路與通訊、系統與硬體、資料與資料庫、多媒體與視覺、軟體工程、人機互動、資訊管理、計算理論、生醫資訊。實際歸類由建置時程式輔助產草稿、PR review 人工把關。

## 篩選邏輯 `filter.mjs`

新增純函式 `expandArea(term, index)`：
- 若 `term` 命中詞彙表（等於某 `name` 或某 `alias`，比對前 trim + 不分大小寫）→ 先定位其 canonical 節點，回傳「該節點子樹（含自身與所有後代）的全部 canonical name ＋ 這些節點的所有 aliases」組成的集合
- 若 `term` 不在詞彙表（長尾字串）→ 回傳 `new Set([term])`

`index` 由 tags.json 預先建好：`aliasToCanonical`（alias/name 小寫 → canonical name）、`children`（canonical → 直接子節點）。建索引的函式 `buildTagIndex(tags)` 另置於 `src/tags.js`（載入 tags.json 並輸出 index），與資料載入慣例一致。

`filterProfessors` 的 `areas` 比對改為：對每個選定 term 各自 `expandArea` 得到 accepted set，教授只要有**任一** raw area ∈ 該 set 即滿足此 term；多個 term 之間仍為 AND（維持現有語意）。未提供 index 時退回精確比對（向後相容、測試友善）。

行為範例：
- 選「資訊安全」→ 教授標網頁安全／密碼學／資安／cybersecurity 皆命中
- 選「密碼學」→ 只有密碼學／cryptography，不上擴到整個資訊安全
- 選只出現 1 次的長尾字串 → 精確比對，與現行一致

## UI `ProfessorSearch.jsx`

現有「熱門領域」`<details>` 面板改為兩層分類樹：
- 列出頂層大類（`parent === null`）
- 每個大類可展開顯示其子領域（巢狀 `<details>` 或縮排區塊）
- 點大類或子領域皆加入選取（`selAreas`）；選取後的比對走上述擴展邏輯
- 卡片上 raw tag 點擊行為不變：加入 `selAreas`，若該字串在詞彙表則自然擴展、不在則精確比對

`selAreas` 仍是字串陣列，元素為使用者點選的 canonical name 或 raw 字串——資料結構不變，只有比對邏輯 taxonomy-aware。

## 驗證 `scripts/validate.mjs`

新增 tags.json 檢查（找不到檔案則跳過）：
- 每節點有 `name`（非空字串、全表唯一）、`aliases`（字串陣列）、`parent`（null 或字串）
- `parent` 非 null 時必須指到存在的 `name`
- 無循環（沿 parent 上溯不得回到自身）
- 所有 `alias`（小寫 trim 後）全表唯一，且不與任何 `name` 衝突

## 測試 `filter.test.mjs`

新增 `expandArea` / taxonomy-aware `filterProfessors` 測試：
- 上位類別擴展到子類（選資訊安全 → 命中只標網頁安全的教授）
- 子類不上擴（選密碼學 → 不命中只標網頁安全的教授）
- 同義詞折疊（選機器學習 → 命中只標 Machine Learning 的教授）
- 長尾 fallback（未知字串精確比對）
- 多 term AND 維持

## 檔案結構

| 檔案 | 責任 |
|---|---|
| `src/tags.json` | 受控詞彙資料 |
| `src/tags.js` | 載入 tags.json、`buildTagIndex` 輸出查詢索引 |
| `src/filter.mjs` | 新增 `expandArea`、taxonomy-aware 比對 |
| `src/ProfessorSearch.jsx` | 分類樹 UI |
| `scripts/validate.mjs` | tags.json 驗證 |
