import { createContext, useContext, useEffect, useState } from 'react'
import schoolDeptEn from './school-dept-en.json'

const LANG_KEY = 'compass-lang'

// ponytail: 介面字串全放這張表；學校／系所／教授姓名維持中文（資料本身沒有英文）
const STRINGS = {
  zh: {
    tagline: '台灣國立大學資訊領域教授查詢 · Comprehensive Professor and School Search System',
    tabProfs: '教授查詢',
    tabSchedule: '推甄時程',
    themeToggle: '切換亮暗色主題',
    langToggle: 'Switch to English',
    // 教授查詢
    search: '搜尋',
    searchPlaceholder: '搜尋姓名、實驗室、研究領域…',
    school: '學校',
    deptType: '系所類型',
    favOnly: '只看最愛',
    areaTree: '研究領域分類',
    areaFilter: '領域篩選：',
    instituteLabel: '兼屬',
    instituteFilter: '所別篩選：',
    countSuffix: '位教授',
    website: '個人網頁',
    noProfs: '沒有符合條件的教授',
    addFav: '加入最愛',
    removeFav: '移除最愛',
    // 推甄時程
    viewCalendar: '月曆',
    viewTimeline: '時間軸',
    viewList: '清單',
    downloadIcs: '下載 .ics',
    eventsSuffix: '個事件',
    schedIntro:
      '下載 .ics 匯入 Google 日曆可一次加入整批事件，再分享給同學。',
    staleTitle: '這是往年（{year} 學年度）時程',
    staleBody:
      '{target} 學年度簡章尚未公告（各校約於 9 月起陸續公布）。以下日期僅供推估各階段時間點，實際時程請以屆時公告為準。',
    eventKind: '事件類型',
    addToGoogle: '加入 Google 日曆（此事件）',
    downloadSchool: '下載此校時程 .ics',
    officialDoc: '官方簡章',
    close: '關閉',
    noEvents: '沒有符合條件的事件',
    noSchools: '沒有符合條件的學校',
    rowApply: '報名',
    rowReview: '資料審查',
    rowInterview: '面試/複試',
    rowResult: '放榜',
    academicYear: '學年度',
    prevYear: '參考往年',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
  },
  en: {
    tagline: 'Professors in CS-related fields at Taiwan national universities · COMPASS',
    tabProfs: 'Professors',
    tabSchedule: 'Admission Schedule',
    themeToggle: 'Toggle light/dark theme',
    langToggle: '切換為中文',
    search: 'Search',
    searchPlaceholder: 'Search name, lab, research area…',
    school: 'School',
    deptType: 'Department',
    favOnly: 'Favorites only',
    areaTree: 'Research Areas',
    areaFilter: 'Filters:',
    instituteLabel: 'Also in',
    instituteFilter: 'Institute:',
    countSuffix: 'professors',
    website: 'Homepage',
    noProfs: 'No professors match these filters',
    addFav: 'Add to favorites',
    removeFav: 'Remove from favorites',
    viewCalendar: 'Calendar',
    viewTimeline: 'Timeline',
    viewList: 'List',
    downloadIcs: 'Download .ics',
    eventsSuffix: 'events',
    schedIntro:
      'Download the .ics and import it into Google Calendar to add every event at once, then share the calendar.',
    staleTitle: 'These are previous-year (AY {year}) dates',
    staleBody:
      'The AY {target} brochures are not published yet (schools release them from September onward). Use these dates only to estimate when each stage happens; always confirm against the official announcement.',
    eventKind: 'Event type',
    addToGoogle: 'Add this event to Google Calendar',
    downloadSchool: 'Download this school’s .ics',
    officialDoc: 'Official brochure',
    close: 'Close',
    noEvents: 'No events match these filters',
    noSchools: 'No schools match these filters',
    rowApply: 'Application',
    rowReview: 'Document review',
    rowInterview: 'Interview',
    rowResult: 'Results',
    academicYear: 'academic year',
    prevYear: 'previous year',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
}

// 資料裡的中文值 → 英文（學校/系所/姓名不譯，這些是專有名詞且無英文資料）
const DEPT_TYPE_EN = { 資工: 'CS', 偏所: 'CS-related', 資管: 'IM', 電機: 'EE' }
const KIND_EN = { 報名: 'Application', 審查: 'Review', 面試: 'Interview', 放榜: 'Results' }
const TITLE_EN = {
  教授: 'Professor',
  副教授: 'Associate Professor',
  助理教授: 'Assistant Professor',
  特聘教授: 'Distinguished Professor',
  講座教授: 'Chair Professor',
  終身特聘教授: 'Lifetime Distinguished Professor',
  名譽教授: 'Emeritus Professor',
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) ?? 'zh')

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant'
  }, [lang])

  const t = (key, vars) => {
    const s = STRINGS[lang][key] ?? STRINGS.zh[key] ?? key
    return vars ? Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), s) : s
  }
  // 資料值翻譯：查無對照就原樣顯示（不臆測）
  const td = (map, value) => (lang === 'en' ? (map[value] ?? value) : value)

  const value = {
    lang,
    setLang,
    toggleLang: () => setLang(lang === 'zh' ? 'en' : 'zh'),
    t,
    deptType: (v) => td(DEPT_TYPE_EN, v),
    kind: (v) => td(KIND_EN, v),
    title: (v) => td(TITLE_EN, v),
    school: (v) => (lang === 'en' ? (schoolDeptEn.schools[v]?.abbr ?? v) : v),
    schoolFull: (v, full) =>
      lang === 'en' ? (schoolDeptEn.schools[v]?.full ?? full ?? v) : (full ?? v),
    dept: (v) => (lang === 'en' ? (schoolDeptEn.depts[v] ?? v) : v),
    // 教授姓名：有官方英文名才用，沒有就顯示中文（絕不音譯猜測）
    profName: (p) => (lang === 'en' ? (p.nameEn || p.name) : p.name),
    // month 為 0-based
    monthLabel: (year, month) =>
      lang === 'en' ? `${MONTHS_EN[month]} ${year}` : `${year} 年 ${month + 1} 月`,
    monthShort: (month) => (lang === 'en' ? MONTHS_EN_SHORT[month] : `${month + 1} 月`),
  }
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
