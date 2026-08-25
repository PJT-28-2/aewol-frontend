import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/recurring', () => ({
  recurringApi: {
    createRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    getRecurrings: vi.fn(),
    deleteRecurring: vi.fn(),
  },
}))

import { recurringApi } from '@/api/recurring'
import { useAuthStore } from './auth'
import { usePaymentStore } from './payment'

const payload = {
  merchantName: '강아지 사료',
  amount: 32000,
  dayOfMonth: 15,
  category: 'FOOD',
  petId: 'pet-1',
}

const createdResult = {
  recurringId: '11',
  itemName: '강아지 사료',
  price: 32000,
  cycleDay: 15,
  nextPaymentDate: '2026-09-15',
  category: 'FOOD',
  petId: 'pet-1',
}

describe('usePaymentStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('등록이 실패했다가 같은 내용으로 재시도하면 멱등키를 재사용한다', async () => {
    const networkError = new Error('network error')
    recurringApi.createRecurring
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({ data: { result: createdResult } })
    const store = usePaymentStore()

    await expect(store.createRecurringPayment(payload)).rejects.toBe(networkError)
    await expect(store.createRecurringPayment(payload)).resolves.toMatchObject({ id: '11' })

    const [firstRequest, retriedRequest] = recurringApi.createRecurring.mock.calls.map(
      ([body]) => body,
    )
    expect(retriedRequest.idempotencyKey).toBe(firstRequest.idempotencyKey)
    expect(store.pendingCreateKey).toBeNull()
    expect(sessionStorage.getItem('pendingRecurringCreate')).toBeNull()
  })

  it('등록 내용이 바뀌면 새 멱등키를 사용한다', async () => {
    recurringApi.createRecurring.mockRejectedValue(new Error('network error'))
    const store = usePaymentStore()

    await expect(store.createRecurringPayment(payload)).rejects.toThrow()
    await expect(store.createRecurringPayment({ ...payload, amount: 40000 })).rejects.toThrow()

    const [firstRequest, changedRequest] = recurringApi.createRecurring.mock.calls.map(
      ([body]) => body,
    )
    expect(changedRequest.idempotencyKey).not.toBe(firstRequest.idempotencyKey)
  })

  it('변경 요청에는 멱등키를 보내지 않는다', async () => {
    recurringApi.updateRecurring.mockResolvedValue({ data: { result: createdResult } })
    const store = usePaymentStore()

    await store.updateRecurringPayment('11', payload)

    expect(recurringApi.updateRecurring.mock.calls[0][1].idempotencyKey).toBeUndefined()
  })

  it('새로고침 뒤에도 같은 등록 내용이면 멱등키를 재사용한다', async () => {
    recurringApi.createRecurring.mockRejectedValue(new Error('network error'))
    const store = usePaymentStore()
    await expect(store.createRecurringPayment(payload)).rejects.toThrow()
    const firstKey = store.pendingCreateKey

    setActivePinia(createPinia())
    const restored = usePaymentStore()
    await expect(restored.createRecurringPayment(payload)).rejects.toThrow()

    expect(restored.pendingCreateKey).toBe(firstKey)
    expect(recurringApi.createRecurring.mock.calls[1][0].idempotencyKey).toBe(firstKey)
  })

  it('등록 실패 후 로그아웃하면 같은 내용도 새 멱등키를 쓴다', async () => {
    recurringApi.createRecurring.mockRejectedValue(new Error('network error'))
    const paymentStore = usePaymentStore()
    await expect(paymentStore.createRecurringPayment(payload)).rejects.toThrow()
    const firstKey = paymentStore.pendingCreateKey
    expect(firstKey).toBeTruthy()
    expect(paymentStore.pendingCreateSignature).toBe('pet-1:강아지 사료:32000:15:FOOD')

    useAuthStore().clearSession()

    expect(paymentStore.pendingCreateKey).toBeNull()
    expect(paymentStore.pendingCreateSignature).toBe('')
    expect(sessionStorage.getItem('pendingRecurringCreate')).toBeNull()

    await expect(paymentStore.createRecurringPayment(payload)).rejects.toThrow()
    expect(paymentStore.pendingCreateKey).not.toBe(firstKey)
    expect(recurringApi.createRecurring.mock.calls[1][0].idempotencyKey).not.toBe(firstKey)
  })
})
