import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getReports: vi.fn(),
  getReport: vi.fn(),
  resolve: vi.fn(),
}))

vi.mock('@/api/adminDiaryReport', () => ({
  adminDiaryReportApi: mocks,
}))

import { useAdminDiaryReportStore } from './adminDiaryReport'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('admin diary report store', () => {
  it('상태와 페이지를 포함해 신고 목록을 조회한다', async () => {
    const store = useAdminDiaryReportStore()
    const reports = [{ reportId: '1', status: 'PENDING' }]
    mocks.getReports.mockResolvedValue({
      data: { result: { reports, page: 1, size: 20, hasNext: true } },
    })

    await store.fetchReports({ page: 1, status: 'PENDING' })

    expect(mocks.getReports).toHaveBeenCalledWith({ page: 1, size: 20, status: 'PENDING' })
    expect(store.reports).toEqual(reports)
    expect(store.hasNext).toBe(true)
  })

  it('전체 필터는 status 파라미터를 보내지 않는다', async () => {
    const store = useAdminDiaryReportStore()
    mocks.getReports.mockResolvedValue({ data: { result: { reports: [], page: 0 } } })

    await store.fetchReports({ page: 0, status: '' })

    expect(mocks.getReports).toHaveBeenCalledWith({ page: 0, size: 20 })
  })

  it('처리 성공 시 같은 게시물의 신고 상태를 함께 갱신한다', async () => {
    const store = useAdminDiaryReportStore()
    store.reports = [
      { reportId: '1', diaryId: 'diary-1', status: 'PENDING' },
      { reportId: '2', diaryId: 'diary-1', status: 'PENDING' },
    ]
    mocks.resolve.mockResolvedValue({
      data: { result: { reportId: '1', diaryId: 'diary-1', status: 'RESOLVED', resolution: 'RESTORE' } },
    })

    expect(await store.resolveReport('1', 'RESTORE', ' 오탐 ')).toBe(true)

    expect(mocks.resolve).toHaveBeenCalledWith('1', { resolution: 'RESTORE', adminNote: '오탐' })
    expect(store.reports.every(({ status }) => status === 'RESOLVED')).toBe(true)
  })

  it('처리 실패 메시지를 보존한다', async () => {
    const store = useAdminDiaryReportStore()
    mocks.resolve.mockRejectedValue({ response: { data: { message: '이미 처리된 신고입니다.' } } })

    expect(await store.resolveReport('1', 'KEEP_HIDDEN', '')).toBe(false)
    expect(store.operationError).toBe('이미 처리된 신고입니다.')
  })
})
