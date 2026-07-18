# COMPASS

**Comprehensive Professor and School Search System** — 台灣國立大學資訊領域教授查詢。

推甄用：整理國立大學資工所、資訊相關偏所、資管所、電機所（資訊相關組）教授資料的查詢網站。純靜態 Vite + React，資料以 JSON 隨站打包，無後端。

## 開發

    npm install
    npm run dev        # 開發伺服器
    npm test           # 篩選邏輯測試
    npm run validate   # 資料格式驗證
    npm run build      # 產出 dist/

## 更新資料

編輯 `src/data/<school>.json`（一校一檔），欄位格式見
[設計文件](docs/superpowers/specs/2026-07-17-prof-summary-design.md)，改完跑 `npm run validate`。
個人筆記寫在教授的 `notes` 欄位。

## 部署（GitHub Pages）

1. 建立 GitHub repo 並 push
2. `npm run build` 後將 `dist/` 部署，或於 repo Settings → Pages 選擇 GitHub Actions（Vite 官方 workflow）
3. `vite.config.js` 已設 `base: './'`，不需依 repo 名稱調整

## License

[MIT](LICENSE) — JelyF1shhhhhh、w1nter（contributor）。
