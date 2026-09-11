// 把時程資料的日期欄位（含區間與註記）解析成行事曆事件
const DATE = /^(\d{4}-\d{2}-\d{2})(?:\s*[~～]\s*(\d{4}-\d{2}-\d{2}))?/

export const KINDS = ['報名', '審查', '面試', '放榜']

// 依全形/半形括號深度切分「、」，避免切到註記內的頓號
export function splitSegments(text) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of text) {
    if (ch === '（' || ch === '(') depth++
    else if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1)
    if (ch === '、' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter(Boolean)
}

// "2025-11-07（第一次放榜）、2025-11-21（第二次）" → [{start,end,note}, …]
// ponytail: 只取每段開頭的日期；註記裡的日期（「另於2025-11-19公告」）留在 note，不另建事件
export function parseDateField(text) {
  if (!text) return []
  return splitSegments(text).flatMap((seg) => {
    const m = seg.match(DATE)
    if (!m) return []
    const note = seg
      .slice(m[0].length)
      .trim()
      .replace(/^[（(]/, '')
      .replace(/[）)]$/, '')
      .trim()
    return [{ start: m[1], end: m[2] ?? m[1], note }]
  })
}

function roundDates(round, kind) {
  if (kind === '報名') {
    const start = round.applyStart || round.applyEnd
    if (!start) return []
    return [{ start, end: round.applyEnd || start, note: '' }]
  }
  return parseDateField({ 審查: round.review, 面試: round.interview, 放榜: round.result }[kind])
}

export function buildEvents(schedules) {
  const events = []
  for (const s of schedules) {
    for (const r of s.rounds ?? []) {
      for (const kind of KINDS) {
        roundDates(r, kind).forEach((d, i) => {
          events.push({
            id: `${s.school}-${r.round}-${kind}-${i}`,
            school: s.school,
            schoolFull: s.schoolFull,
            round: r.round,
            academicYear: r.academicYear,
            kind,
            start: d.start,
            end: d.end,
            note: d.note,
            source: r.source ?? '',
          })
        })
      }
    }
  }
  return events.sort(
    (a, b) => a.start.localeCompare(b.start) || a.school.localeCompare(b.school, 'zh-Hant'),
  )
}

// kindFn 讓英文模式把「報名」等事件類型換成英文；學校與梯次為專有名詞，不譯
export function eventTitle(e, kindFn = (k) => k) {
  const prefix = `${e.school}${e.round === '甄試' ? '' : e.round}`
  const kind = kindFn(e.kind)
  // 中文不加空格（成大報名），英文才加（成大 Application）
  return /[A-Za-z]/.test(kind) ? `${prefix} ${kind}` : `${prefix}${kind}`
}

// 清單／行事曆的學校排序：依最早報名截止日，無 applyEnd 者排最後。
// 還在用往年資料的學校日期是去年的，會整批排到最前面誤導人，先壓到後面。
export const sortKey = (s, targetYear) =>
  (s.rounds.some((r) => r.academicYear === targetYear) ? '0' : '1') +
  (s.rounds.map((r) => r.applyEnd).filter(Boolean).sort()[0] ?? '9999')
