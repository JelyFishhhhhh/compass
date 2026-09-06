// 長尾研究領域的中英對照（受控詞彙 tags.json 沒收錄的字串）
// 分片存放，方便多人／多批次維護；載入時合併
const shards = import.meta.glob('./data/area-i18n/*.json', { eager: true })

export const areaI18n = Object.assign({}, ...Object.values(shards).map((m) => m.default ?? m))
