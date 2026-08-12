import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/transaction', () => ({
  transactionApi: {
    getTransactions: vi.fn(),
    getRecentTransactions: vi.fn(),
    getTransaction: vi.fn(),
    createPayment: vi.fn(),
    updateTag: vi.fn(),
  },
}))

import { transactionApi } from '@/api/transaction'
import { useTransactionStore } from './transaction'

const backendTransaction = {
  transactionId: '17',
  txnType: 'PAYMENT',
  amount: 42000,
  category: 'HOSPITAL',
  petId: 'pet-1',
  merchantName: '24시 동물병원',
  memo: '진료비',
  autoTagged: 'Y',
  transactionDate: '2026-08-11T15:24:30',
  paymentMethod: '애월 통합 지갑',
}

describe('useTransactionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('거래 목록 공통 응답을 화면 데이터로 변환한다', async () => {
    transactionApi.getTransactions.mockResolvedValue({
      data: {
        result: {
          transactions: [backendTransaction],
          nextCursor: 'next-page',
        },
      },
    })

    const store = useTransactionStore()
    await store.fetchTransactions({ period: '2026-08' })

    expect(store.transactions[0]).toMatchObject({
      id: '17',
      type: 'withdraw',
      amount: -42000,
      category: 'MEDICAL',
      date: '2026-08-11',
      time: '15:24',
      autoTagged: true,
    })
    expect(store.nextCursor).toBe('next-page')
  })

  it('다음 페이지 거래를 기존 목록 뒤에 추가한다', async () => {
    transactionApi.getTransactions
      .mockResolvedValueOnce({
        data: { result: { transactions: [backendTransaction], nextCursor: 'next-page' } },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            transactions: [{ ...backendTransaction, transactionId: '16' }],
            nextCursor: null,
          },
        },
      })

    const store = useTransactionStore()
    await store.fetchTransactions({ period: '2026-08' })
    await store.fetchTransactions(
      { period: '2026-08', cursor: store.nextCursor },
      { append: true },
    )

    expect(store.transactions.map((transaction) => transaction.id)).toEqual(['17', '16'])
    expect(store.nextCursor).toBeNull()
  })

  it('충전 거래는 양수 금액과 charge 타입으로 변환한다', async () => {
    transactionApi.getRecentTransactions.mockResolvedValue({
      data: {
        result: [{
          ...backendTransaction,
          transactionId: '18',
          txnType: 'DEPOSIT',
          amount: 100000,
          category: null,
        }],
      },
    })

    const store = useTransactionStore()
    await store.fetchRecentTransactions()

    expect(store.recentTransactions[0]).toMatchObject({
      id: '18',
      type: 'charge',
      amount: 100000,
    })
  })

  it('재분류 시 화면 카테고리를 백엔드 카테고리로 변환한다', async () => {
    transactionApi.updateTag.mockResolvedValue({
      data: {
        result: {
          ...backendTransaction,
          category: 'TOY',
          autoTagged: 'N',
        },
      },
    })

    const store = useTransactionStore()
    await store.updateTransactionTag('17', {
      category: 'SUPPLIES',
      petId: 'pet-1',
    })

    expect(transactionApi.updateTag).toHaveBeenCalledWith('17', {
      category: 'TOY',
      petId: 'pet-1',
    })
    expect(store.currentTxn.category).toBe('SUPPLIES')
    expect(store.currentTxn.autoTagged).toBe(false)
  })
})
