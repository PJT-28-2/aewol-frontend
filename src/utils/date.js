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
 * 오늘부터 대상 날짜까지 남은 "달력 날짜" 수를 계산한다. "YYYY-MM-DD"로 시작하는 문자열만
 * 사용하며(시간 정보는 무시), UTC 파싱으로 인한 날짜 밀림 없이 로컬 연/월/일 기준으로 비교한다.
 * 로컬 자정 Date로 뺄셈하면 서머타임 전환일에 하루가 23시간/25시간이 되어 결과가 하루씩
 * 밀릴 수 있어(예: DST 종료일 다음 날짜가 diff 2로 계산됨), 항상 정확히 24시간인
 * Date.UTC 기준으로 변환한 뒤 계산한다.
 *
 * @param {string} targetDate `YYYY-MM-DD`로 시작하는 날짜(시간) 문자열
 * @param {Date} [now] 기준 시각(테스트/반응형 갱신용, 기본값은 호출 시점의 현재 시각)
 * @returns {number} 오늘부터 대상 날짜까지 남은 일수(지났으면 0 이하)
 */
export function getDaysUntil(targetDate, now = new Date()) {
  const [year, month, day] = targetDate.slice(0, 10).split('-').map(Number)
  const targetUTC = Date.UTC(year, month - 1, day)
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetUTC - todayUTC) / (1000 * 60 * 60 * 24))
}

/**
 * 마감일까지 남은 일수를 "D-N" 라벨로, 마감 당일이면 "D-DAY"로, 마감일이 지났으면
 * "마감"으로 변환한다. 표시(display) 전용이며 날짜 단위로만 비교하므로, 실제 마감
 * 시각과의 정확한 선후 비교(버튼 활성화 등)에는 getDeadlineTimestamp를 사용해야 한다
 * (마감 당일은 이 라벨이 "D-DAY"를 보여주는 동안에도 23:59:59까지는 아직 유효하다).
 *
 * @param {string} deadline `YYYY-MM-DD`로 시작하는 날짜(시간) 문자열
 * @param {Date} [now] 기준 시각(테스트/반응형 갱신용, 기본값은 호출 시점의 현재 시각)
 * @returns {string} `D-N`, `D-DAY`, 또는 `마감`
 */
export function formatDDayLabel(deadline, now = new Date()) {
  const diffDays = getDaysUntil(deadline, now)
  if (diffDays > 0) return `D-${diffDays}`
  if (diffDays === 0) return 'D-DAY'
  return '마감'
}

/**
 * 마감 문자열을 실제 만료 시각(epoch ms)으로 변환한다. 시간 정보가 있으면(`T` 포함) 그대로
 * 로컬 시각으로 해석하고, 날짜만 있으면(캘린더에서 날짜만 선택하는 마감일 등) 그날
 * 23:59:59.999까지 유효한 것으로 해석한다.
 *
 * new Date(...)에 연/월/일을 그대로 넘기면 "2026-02-31"처럼 존재하지 않는 날짜를 3월 3일로
 * 자동 보정해버려 API가 잘못된 값을 내려도 그럴듯한 타임스탬프가 나온다. isValidCalendarDate로
 * 먼저 걸러서, 존재하지 않는 날짜는 보정 없이 NaN을 반환하도록 한다.
 *
 * @param {string | null | undefined} deadline `YYYY-MM-DD` 또는 `YYYY-MM-DDTHH:mm:ss` 형식의 마감 문자열
 * @returns {number} 마감 시각의 epoch 밀리초 (값이 없거나 유효하지 않으면 NaN)
 */
export function getDeadlineTimestamp(deadline) {
  if (!deadline) return NaN
  if (!isValidCalendarDate(deadline.slice(0, 10))) return NaN
  if (deadline.includes('T')) {
    return new Date(deadline).getTime()
  }
  const [year, month, day] = deadline.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
}

/**
 * "YYYY-MM-DD" 형식의 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환한다.
 *
 * @param {string | null | undefined} isoDate `YYYY-MM-DD` 형식의 날짜 문자열
 * @returns {string} `YYYY.MM.DD` 형식의 문자열
 */
export function formatDateDot(isoDate) {
  if (!isoDate) return ''
  return isoDate.replaceAll('-', '.')
}

/**
 * "YYYY-MM-DDTHH:mm:ss" 형식의 날짜시간 문자열을 "YYYY.MM.DD HH:mm" 형식으로 변환한다.
 *
 * @param {string} isoDateTime `YYYY-MM-DDTHH:mm:ss` 형식의 날짜시간 문자열
 * @returns {string} `YYYY.MM.DD HH:mm` 형식의 문자열
 */
export function formatDateTimeDot(isoDateTime) {
  if (!isoDateTime) return ''
  const [datePart, timePart] = isoDateTime.split('T')
  return timePart ? `${formatDateDot(datePart)} ${timePart.slice(0, 5)}` : formatDateDot(datePart)
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/**
 * "YYYY-MM-DD" 형식의 배송 예정일 문자열을 "M/D(요일) 도착 예정" 라벨로 변환한다.
 * 등록 직후(잠정: 마감일+예상일수)와 목표 수량 달성 이후(확정: 달성일+예상일수) 모두
 * delivery_date 값 자체는 백엔드가 계산해 내려주므로, 프론트는 값을 그대로 포맷팅만 한다.
 * UTC 파싱으로 인한 날짜 밀림을 피하기 위해 로컬 자정 Date로 변환해서 사용한다.
 *
 * @param {string | null | undefined} deliveryDate `YYYY-MM-DD` 형식의 배송 예정일
 * @returns {string} `M/D(요일) 도착 예정` 형식의 문자열, 값이 없으면(API 에러 등) 빈 문자열
 */
export function formatArrivalDateLabel(deliveryDate) {
  if (!deliveryDate) return ''
  const [year, month, day] = deliveryDate.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]}) 도착 예정`
}

/**
 * 생년월일 문자열로 만 나이를 계산한다. 올해 생일이 아직 지나지 않았으면 1을 뺀다.
 *
 * @param {string | null | undefined} birthDate `YYYY-MM-DD` 형식의 생년월일
 * @returns {number | null} 만 나이 (값이 없거나 유효하지 않으면 null)
 */
export function calcAgeFromBirthDate(birthDate) {
  if (!birthDate) return null
  const [year, month, day] = birthDate.slice(0, 10).split('-').map(Number)
  const today = new Date()
  let age = today.getFullYear() - year
  const hasHadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day)
  if (!hasHadBirthday) age -= 1
  return age
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

/**
 * YYYY.MM.DD 또는 YYYY-MM-DD 문자열이 실제 달력에 존재하는 날짜인지 확인한다.
 * Date의 월/일 자동 보정(예: 5월 96일이 8월 날짜로 변환됨)을 허용하지 않는다.
 *
 * @param {string} value 확인할 날짜 문자열
 * @returns {boolean} 유효한 달력 날짜인지 여부
 */
export function isValidCalendarDate(value) {
  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value)
  if (!match) return false

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}
