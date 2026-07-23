const modules = import.meta.glob('./data/schedule/*.json', { eager: true })

// 依最早報名截止日排序；無 applyEnd 者排最後
export const schedules = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => {
    const ka = a.rounds.map((r) => r.applyEnd).filter(Boolean).sort()[0] ?? '9999'
    const kb = b.rounds.map((r) => r.applyEnd).filter(Boolean).sort()[0] ?? '9999'
    return ka.localeCompare(kb)
  })
