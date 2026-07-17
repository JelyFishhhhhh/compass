const modules = import.meta.glob('./data/*.json', { eager: true })

export const schools = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => a.school.localeCompare(b.school, 'zh-Hant'))

export const professors = schools.flatMap((s) =>
  s.professors.map((p) => ({ ...p, school: s.school, schoolFull: s.schoolFull })),
)
