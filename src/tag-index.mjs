export const normalize = (s) => s.trim().toLowerCase()

export function buildTagIndex(tags) {
  const byName = new Map()
  const children = new Map()
  const aliasToCanonical = new Map()
  const roots = []

  for (const node of tags) {
    byName.set(node.name, node)
    if (node.parent === null) roots.push(node.name)
  }
  for (const node of tags) {
    aliasToCanonical.set(normalize(node.name), node.name)
    for (const a of node.aliases) aliasToCanonical.set(normalize(a), node.name)
    if (node.parent !== null) {
      if (!children.has(node.parent)) children.set(node.parent, [])
      children.get(node.parent).push(node.name)
    }
  }
  return { byName, children, aliasToCanonical, roots }
}
