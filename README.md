# COMPASS

**Comprehensive Professor and School Search System** — 台灣國立大學資訊領域教授查詢。

推甄用：整理國立大學資工所、資訊相關偏所、資管所、電機所（資訊相關組）教授資料的查詢網站。純靜態 Vite + React，資料以 JSON 隨站打包，無後端。

協作方式見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 開發

    npm install
    npm run dev        # 開發伺服器
    npm test           # 篩選邏輯測試
    npm run validate   # 資料格式驗證
    npm run build      # 產出 dist/

## 更新資料

編輯 `src/data/<school>.json`（一校一檔），欄位格式見
[設計文件](docs/superpowers/specs/2026-07-17-prof-summary-design.md)，改完跑 `npm run validate`。
個人筆記寫在教授的 `notes` 欄位；實驗室網頁可加選填欄位 `labWebsite`（http(s) 連結，
有值時實驗室名稱會變成連結）。

目前涵蓋 31 所國立大學、1498 位教授（四大四中台科北科＋各國立大學資工／偏所／資管／電機資訊相關）。

## TODO（歡迎協作）

- [ ] 研究領域標籤分類體系：受控詞彙表（`tags.json`：canonical／aliases／parent／related）——
      中英文與同義詞統一（資安＝資訊安全＝cybersecurity）、階層分類（資訊安全 > 網頁安全／密碼學／系統安全），
      查詢時同義詞展開＋上位類別擴展（查「資訊安全」涵蓋子類，查「密碼學」不上擴）、
      加權排序 exact > alias > descendant > related
- [ ] 推甄時程：四大四中＋台科北科的一推（第一梯次）與二推（第二梯次）報名／繳件／面試／放榜日期，
      規劃為獨立資料檔（如 `src/data/schedule/<school>.json`），網站上可依學校查詢與依日期排序
- [ ] 補完剩餘學校：澎湖科大
- [ ] `labWebsite` 欄位資料補充（各實驗室網頁連結）
- [ ] `highlights` 欄位補充（教授近年研究亮點 1-3 行）
- [ ] 第 3 批資料（政大等 16 校）人工抽查覆核
- [x] 我的最愛（localStorage）
- [x] 亮色／暗色主題
- [x] 熱門領域標籤快速篩選

## 部署（GitHub Pages）

1. 建立 GitHub repo 並 push
2. `npm run build` 後將 `dist/` 部署，或於 repo Settings → Pages 選擇 GitHub Actions（Vite 官方 workflow）
3. `vite.config.js` 已設 `base: './'`，不需依 repo 名稱調整

## License

[MIT](LICENSE) © 2026 JelyF1shhhhhh（w1nter 個人工作室）。
