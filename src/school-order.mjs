// 學校排序：依推甄志願序（分數落點）而非筆劃。要調整順序改這個陣列即可。
export const SCHOOL_ORDER = [
  '台大',
  '清大',
  '陽明交大',
  '成大',
  '台科大',
  '中央',
  '中山',
  '中興',
  '中正',
  '北科大',
  '政大',
  '台師大',
  '海大',
  '台北大',
  '暨南',
  '東華',
  '高雄',
  '雲科大',
  '高科大',
  '嘉義',
  '彰師大',
  '高師大',
  '台南',
  '宜蘭',
  '聯合',
  '屏東',
  '台東',
  '屏科大',
  '虎尾科大',
  '勤益科大',
  '金門',
]

const rank = new Map(SCHOOL_ORDER.map((s, i) => [s, i]))

// ponytail: 不在名單上的學校（之後新增的）排最後、彼此依校名排
export function compareSchools(a, b) {
  const ra = rank.get(a) ?? Infinity
  const rb = rank.get(b) ?? Infinity
  return ra === rb ? a.localeCompare(b, 'zh-Hant') : ra - rb
}
