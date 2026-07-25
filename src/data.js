import { compareSchools } from './school-order.mjs'

const modules = import.meta.glob('./data/*.json', { eager: true })

export const schools = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => compareSchools(a.school, b.school))

export const professors = schools.flatMap((s) =>
  s.professors.map((p) => ({ ...p, school: s.school, schoolFull: s.schoolFull })),
)
