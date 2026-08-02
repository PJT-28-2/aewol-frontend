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
 * "YYYY-MM-DD" 형식의 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환한다.
 *
 * @param {string} isoDate `YYYY-MM-DD` 형식의 날짜 문자열
 * @returns {string} `YYYY.MM.DD` 형식의 문자열
 */
export function formatDateDot(isoDate) {
  return isoDate.replaceAll('-', '.')
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
