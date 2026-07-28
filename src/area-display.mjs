import { normalize } from './tag-index.mjs'

// 原始領域字串 → 受控詞彙的 canonical 名稱；不在詞彙表就回 null
export function canonicalOf(raw, index) {
  if (!index) return null
  return index.aliasToCanonical.get(normalize(raw)) ?? null
}

// 顯示用文字，三層查找：
// 1. 受控詞彙 tags.json（canonical 中文 / en）
// 2. 長尾對照表 area-i18n（{zh, en}）
// 3. 都查不到就原樣顯示——不臆測翻譯
export function displayArea(raw, index, lang = 'zh', i18nMap) {
  const canonical = canonicalOf(raw, index)
  if (canonical) {
    if (lang !== 'en') return canonical
    return index.byName.get(canonical)?.en || canonical
  }
  const entry = i18nMap?.[raw.trim()] ?? i18nMap?.[normalize(raw)]
  if (entry) return (lang === 'en' ? entry.en : entry.zh) || raw
  return raw
}
