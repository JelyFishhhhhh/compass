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
