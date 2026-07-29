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
