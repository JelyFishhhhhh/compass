# COMPASS 協作指南

歡迎加入！這份文件說明如何參與 COMPASS（台灣國立大學資訊領域教授查詢）的開發與資料維護。

## 環境設置

```bash
git clone https://github.com/JelyFishhhhhh/compass.git
cd compass
npm install
npm run dev        # http://localhost:5173
```

需要 Node.js 20+。無其他相依（僅 react / react-dom / vite）。

## 專案結構

| 路徑 | 內容 |
|---|---|
| `src/data/<school>.json` | 教授資料，一校一檔（檔名用學校英文縮寫小寫） |
| `src/App.jsx` | 查詢 UI（搜尋、篩選、卡片、最愛、主題） |
| `src/filter.mjs` | 純篩選函式（有測試 `src/filter.test.mjs`） |
| `src/data.js` | 資料載入（`import.meta.glob` 打包全部 JSON） |
| `scripts/validate.mjs` | 資料格式驗證 |

## 維護資料

### 教授欄位

```json
{
  "name": "王小明",
  "title": "教授",
  "dept": "資訊工程學系",
  "deptType": "資工",
  "areas": ["機器學習", "電腦視覺"],
  "lab": "智慧視覺實驗室",
  "labWebsite": "https://...（選填）",
  "website": "https://...",
  "email": "wang@example.edu.tw",
  "highlights": "近年研究方向 1-3 行",
  "notes": "個人筆記"
}
```

規則（violate 會被 `npm run validate` 擋下或 review 退回）：

- `deptType` 只有四值：`資工`／`偏所`／`資管`／`電機`
- **查無資料留空字串或空陣列，絕不臆測**——每一筆都要能對回官方頁面
- 不收兼任、名譽、退休教授；電機／電子系只收資訊相關領域（計算機系統、網路、多媒體、AI/ML、嵌入式/EDA）
- 合聘教授只在主聘系所記一筆
- 切割「專長」字串時，**括號內的頓號不可切開**：`類比/數位系統(車用電子、生醫電子)` 是一個標籤
- `labWebsite` 為選填欄位，有值時必須是 http(s) 連結

### 新增／修改流程

1. 開 branch：`git checkout -b data/<school>`
2. 編輯 `src/data/<school>.json`（新學校請照上方格式建檔，含 `school`／`schoolFull`）
3. `npm run validate` 必須通過
4. `npm run dev` 目視確認顯示正常
5. 發 PR 到 `master`，附上資料來源（各系所官方師資頁 URL）

## 改程式

1. `npm test`（篩選邏輯，`node:test`）與 `npm run build` 必須通過
2. 不新增相依套件；樣式用純 CSS（`src/style.css`，主題色都在 CSS variables）
3. UI 文字一律繁體中文
4. 發 PR 到 `master`

## 授權相關

- 本專案採 [MIT License](LICENSE)，著作權人為 JelyF1shhhhhh（w1nter 工作室）
- **送出 PR 即表示你同意你的貢獻以 MIT 授權釋出**
- 貢獻者名單：重大貢獻（新增整校資料、新功能）歡迎在 PR 中同步把自己加進 README 的 License 段落（格式：`名稱（貢獻內容）`）；LICENSE 檔案的著作權行維持不動
- 資料來源皆為各校公開師資頁面；若教授本人來信要求修改或移除資料，開 issue 標註 `takedown`，維護者會優先處理

## 認領 TODO

README 的 TODO 段落列有待辦事項。認領方式：開 issue 說明你要做哪項＋預計做法，避免撞工。
