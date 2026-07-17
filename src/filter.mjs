export function filterProfessors(professors, { query = '', schools = [], deptTypes = [], areas = [] } = {}) {
  const q = query.trim().toLowerCase()
  return professors.filter((p) => {
    if (schools.length && !schools.includes(p.school)) return false
    if (deptTypes.length && !deptTypes.includes(p.deptType)) return false
    if (areas.length && !areas.every((a) => p.areas.includes(a))) return false
    if (q) {
      const hay = [p.name, p.lab, p.dept, p.highlights, p.notes, ...p.areas].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
