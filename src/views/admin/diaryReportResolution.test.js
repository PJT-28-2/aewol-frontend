import { describe, expect, it } from 'vitest'
import { diaryReportResolutionLabel } from './diaryReportResolution'

describe('diaryReportResolutionLabel', () => {
  it('RESTORE는 복원 완료로 안내한다', () => {
    expect(diaryReportResolutionLabel('RESTORE')).toBe('게시물 복원 완료')
  })

  it('DISMISS는 공개 유지로 안내한다', () => {
    expect(diaryReportResolutionLabel('DISMISS')).toBe('게시물 공개 유지 완료')
  })

  it('KEEP_HIDDEN은 숨김 유지로 안내한다', () => {
    expect(diaryReportResolutionLabel('KEEP_HIDDEN')).toBe('게시물 숨김 유지 완료')
  })
})
