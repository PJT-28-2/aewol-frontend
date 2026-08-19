import { describe, expect, it } from 'vitest'
import { formatDDayLabel, getDeadlineTimestamp } from './date'

describe('formatDDayLabel', () => {
  it('마감일 이전에는 D-N을 반환한다', () => {
    expect(formatDDayLabel('2026-08-22', new Date('2026-08-19T10:00:00'))).toBe('D-3')
  })

  it('마감 당일에는 시각과 무관하게 D-DAY를 반환한다 — 23:59:59까지는 아직 유효한 상태라 "마감"으로 보이면 안 된다', () => {
    expect(formatDDayLabel('2026-08-19', new Date('2026-08-19T00:00:01'))).toBe('D-DAY')
    expect(formatDDayLabel('2026-08-19', new Date('2026-08-19T23:59:59'))).toBe('D-DAY')
  })

  it('마감일 다음 날부터는 마감을 반환한다', () => {
    expect(formatDDayLabel('2026-08-19', new Date('2026-08-20T00:00:00'))).toBe('마감')
    expect(formatDDayLabel('2026-08-19', new Date('2026-08-25T00:00:00'))).toBe('마감')
  })
})

describe('getDeadlineTimestamp', () => {
  it('날짜만 있으면 그날 23:59:59.999를 반환한다', () => {
    expect(getDeadlineTimestamp('2026-08-19')).toBe(new Date(2026, 7, 19, 23, 59, 59, 999).getTime())
  })

  it('T로 구분된 시간이 있으면 그 시각을 그대로 반환한다', () => {
    expect(getDeadlineTimestamp('2026-08-19T15:00:00')).toBe(new Date(2026, 7, 19, 15, 0, 0).getTime())
  })

  // 백엔드(Jackson jackson.date-format: yyyy-MM-dd HH:mm:ss)는 LocalDateTime을 T가 아니라
  // 공백으로 구분해서 내려준다 — 이 형식을 그냥 날짜만 있는 값으로 오인해 시각을 버리고
  // 23:59:59.999로 뭉개버리면 안 된다(2026-08-19 리뷰에서 지적된 케이스)
  it('공백으로 구분된 시간(백엔드 응답 형식)도 그 시각을 그대로 반환한다', () => {
    expect(getDeadlineTimestamp('2026-08-19 15:00:00')).toBe(new Date(2026, 7, 19, 15, 0, 0).getTime())
  })

  it('존재하지 않는 날짜는 NaN을 반환한다', () => {
    expect(getDeadlineTimestamp('2026-02-31')).toBeNaN()
  })

  // Date는 25시나 60분처럼 범위를 벗어난 값을 자동으로 다음 날/다음 시간으로 보정해버리므로,
  // 날짜와 마찬가지로 시간도 범위를 벗어나면 보정 없이 NaN을 반환해야 한다
  it('시/분/초가 범위를 벗어나면 NaN을 반환한다', () => {
    expect(getDeadlineTimestamp('2026-08-19 25:00:00')).toBeNaN()
    expect(getDeadlineTimestamp('2026-08-19 00:60:00')).toBeNaN()
    expect(getDeadlineTimestamp('2026-08-19 00:00:60')).toBeNaN()
  })

  it('값이 없으면 NaN을 반환한다', () => {
    expect(getDeadlineTimestamp(null)).toBeNaN()
    expect(getDeadlineTimestamp(undefined)).toBeNaN()
    expect(getDeadlineTimestamp('')).toBeNaN()
  })
})
