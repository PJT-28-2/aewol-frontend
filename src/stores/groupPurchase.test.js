import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGroupPurchaseCreateStore } from './groupPurchase'

describe('useGroupPurchaseCreateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('isStep2Complete()는 상태 변경 없이 시간만 지나 마감이 지나면 false가 된다', () => {
    vi.setSystemTime(new Date('2026-08-05T00:00:00'))

    const store = useGroupPurchaseCreateStore()
    store.targetQuantity = '2'
    store.deadline = '2026-08-06' // 날짜만 있는 마감은 해당 날짜 23:59:59까지 유효
    store.deliveryFee = '0'
    store.deliveryEstimateDays = '3'

    expect(store.isStep2Complete()).toBe(true)

    // 스토어 상태는 그대로 두고 시스템 시각만 마감 이후로 이동
    vi.setSystemTime(new Date('2026-08-07T00:00:00'))

    expect(store.isStep2Complete()).toBe(false)
  })
})
