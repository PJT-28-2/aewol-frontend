/**
 * 초 단위 남은 시간을 mm:ss 형식으로 변환한다.
 *
 * @param {number} totalSeconds 남은 시간(초)
 * @returns {string} `mm:ss` 형식의 문자열
 */
export function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 연도와 월을 "YYYY년 M월" 형식으로 변환한다.
 *
 * @param {number} year 연도
 * @param {number} month 월 (1~12)
 * @returns {string} `YYYY년 M월` 형식의 문자열
 */
export function formatYearMonth(year, month) {
  return `${year}년 ${month}월`
}

/**
 * 오늘부터 대상 날짜까지 남은 일수를 계산한다. "YYYY-MM-DD"로 시작하는 문자열만 사용하며
 * (시간 정보는 무시), UTC 파싱으로 인한 날짜 밀림 없이 로컬 자정 기준으로 비교한다.
 *
 * @param {string} targetDate `YYYY-MM-DD`로 시작하는 날짜(시간) 문자열
 * @returns {number} 오늘부터 대상 날짜까지 남은 일수(지났으면 0 이하)
 */
export function getDaysUntil(targetDate) {
  const [year, month, day] = targetDate.slice(0, 10).split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((target - startOfToday) / (1000 * 60 * 60 * 24))
}

/**
 * 마감일까지 남은 일수를 "D-N" 라벨로, 마감 당일이거나 지났으면 "마감"으로 변환한다.
 *
 * @param {string} deadline `YYYY-MM-DD`로 시작하는 날짜(시간) 문자열
 * @returns {string} `D-N` 또는 `마감`
 */
export function formatDDayLabel(deadline) {
  const diffDays = getDaysUntil(deadline)
  return diffDays <= 0 ? '마감' : `D-${diffDays}`
}

/**
 * "YYYY-MM-DD" 형식의 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환한다.
 *
 * @param {string} isoDate `YYYY-MM-DD` 형식의 날짜 문자열
 * @returns {string} `YYYY.MM.DD` 형식의 문자열
 */
export function formatDateDot(isoDate) {
  return isoDate.replaceAll('-', '.')
}

/**
 * "YYYY-MM-DDTHH:mm:ss" 형식의 날짜시간 문자열을 "YYYY.MM.DD HH:mm" 형식으로 변환한다.
 *
 * @param {string} isoDateTime `YYYY-MM-DDTHH:mm:ss` 형식의 날짜시간 문자열
 * @returns {string} `YYYY.MM.DD HH:mm` 형식의 문자열
 */
export function formatDateTimeDot(isoDateTime) {
  const [datePart, timePart] = isoDateTime.split('T')
  return timePart ? `${formatDateDot(datePart)} ${timePart.slice(0, 5)}` : formatDateDot(datePart)
}

/**
 * 숫자만 남긴 뒤 "YYYY.MM.DD" 형식으로 자릿수에 맞춰 마침표를 채워 넣는다.
 *
 * @param {string} value 사용자가 입력 중인 생년월일 문자열
 * @returns {string} 마침표가 포함된 생년월일
 */
export function formatBirthDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length < 5) return digits
  if (digits.length < 7) return `${digits.slice(0, 4)}.${digits.slice(4)}`
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}
