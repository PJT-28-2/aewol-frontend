import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
    getCategory: vi.fn(),
  },
}))

import { dashboardApi } from '@/api/dashboard'
import { useDashboardStore } from './dashboard'

describe('useDashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('홈 대시보드 공통 응답에서 result를 저장한다', async () => {
    const summary = {
      walletBalance: 482600,
      monthlySpend: { totalAmount: 73100, changeRate: -12 },
    }
    dashboardApi.getSummary.mockResolvedValue({
      data: { status: 200, message: 'success', result: summary },
    })

    const store = useDashboardStore()

    await expect(store.fetchSummary({ month: '2026-08' })).resolves.toEqual(summary)
    expect(store.summary).toEqual(summary)
  })

  it('카테고리 집계 공통 응답에서 result를 저장한다', async () => {
    const category = {
      yearMonth: '2026-08',
      groupBy: 'CATEGORY',
      totalAmount: 42000,
      items: [{ category: 'HOSPITAL', amount: 42000, petBreakdown: [] }],
    }
    dashboardApi.getCategory.mockResolvedValue({
      data: { status: 200, message: 'success', result: category },
    })

    const store = useDashboardStore()

    await expect(store.fetchCategory({ yearMonth: '2026-08' })).resolves.toEqual(category)
    expect(store.category).toEqual(category)
  })

  it('조회 실패 시 이전 대시보드 데이터를 제거하고 오류를 전달한다', async () => {
    const requestError = new Error('network error')
    dashboardApi.getSummary.mockRejectedValue(requestError)
    dashboardApi.getCategory.mockRejectedValue(requestError)

    const store = useDashboardStore()
    store.summary = { walletBalance: 99999 }
    store.category = { totalAmount: 99999 }

    await expect(store.fetchSummary()).rejects.toBe(requestError)
    await expect(store.fetchCategory()).rejects.toBe(requestError)
    expect(store.summary).toBeNull()
    expect(store.category).toBeNull()
  })
})
