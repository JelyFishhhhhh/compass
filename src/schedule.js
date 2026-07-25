// 目前要申請的學年度（民國）。116 學年度＝2027 年入學，簡章約 2026 年 9 月起陸續公告。
// 收到 116 資料後把這裡改成 '117'（或當時的下一屆），舊資料的「往年」提示會自動出現。
export const TARGET_YEAR = '116'

const modules = import.meta.glob('./data/schedule/*.json', { eager: true })

// 依最早報名截止日排序；無 applyEnd 者排最後
export const schedules = Object.values(modules)
  .map((m) => m.default ?? m)
  .sort((a, b) => {
    const ka = a.rounds.map((r) => r.applyEnd).filter(Boolean).sort()[0] ?? '9999'
    const kb = b.rounds.map((r) => r.applyEnd).filter(Boolean).sort()[0] ?? '9999'
    return ka.localeCompare(kb)
  })
