import { normalize } from './tag-index.mjs'

// 原始領域字串 → 受控詞彙的 canonical 名稱；不在詞彙表就回 null
export function canonicalOf(raw, index) {
  if (!index) return null
  return index.aliasToCanonical.get(normalize(raw)) ?? null
}

// 顯示用文字：詞彙表內依語言回中文 canonical 或英文 en；
// ponytail: 長尾字串（3300+ 只出現一兩次）沒有對照，原樣顯示——不臆測翻譯
export function displayArea(raw, index, lang = 'zh') {
  const canonical = canonicalOf(raw, index)
  if (!canonical) return raw
  if (lang !== 'en') return canonical
  return index.byName.get(canonical)?.en || canonical
}
