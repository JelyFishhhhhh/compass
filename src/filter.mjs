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

// 推甄是分所招生：合聘於偏所／學位學程的教授，主聘雖是資工/電機/資管，
// 但報那個所時他就是該所的老師，所以「偏所」要涵蓋 institutes 非空者。
export const matchesDeptType = (p, types) =>
  types.includes(p.deptType) || (types.includes('偏所') && (p.institutes?.length ?? 0) > 0)

export function filterProfessors(
  professors,
  { query = '', schools = [], deptTypes = [], areas = [], institutes = [], tagIndex } = {},
) {
  const q = query.trim().toLowerCase()
  return professors.filter((p) => {
    if (schools.length && !schools.includes(p.school)) return false
    if (deptTypes.length && !matchesDeptType(p, deptTypes)) return false
    if (institutes.length && !institutes.some((i) => p.institutes?.includes(i))) return false
    if (areas.length) {
      const normAreas = p.areas.map(normalize)
      const ok = areas.every((a) => {
        const set = expandArea(a, tagIndex)
        return normAreas.some((na) => set.has(na))
      })
      if (!ok) return false
    }
    if (q) {
      const hay = [p.name, p.lab, p.dept, p.highlights, p.notes, ...(p.institutes ?? []), ...p.areas]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
