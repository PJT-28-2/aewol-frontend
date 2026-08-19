import { describe, expect, it } from 'vitest'
import { formatDDayLabel } from './date'

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
