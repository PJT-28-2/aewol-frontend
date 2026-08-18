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
      paymentMethod: '애월지갑',
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
          memo: '지갑 충전 (TossPayments)',
        }],
      },
    })

    const store = useTransactionStore()
    await store.fetchRecentTransactions()

    expect(store.recentTransactions[0]).toMatchObject({
      id: '18',
      type: 'charge',
      amount: 100000,
      chargeMethod: 'TossPayments',
    })
  })

  it('환불(REFUND) 거래는 charge가 아니어도 양수 금액으로 변환한다 — 공동구매 참여취소 환불 등', async () => {
    transactionApi.getRecentTransactions.mockResolvedValue({
      data: {
        result: [{
          ...backendTransaction,
          transactionId: '21',
          txnType: 'REFUND',
          amount: 28000,
          category: null,
          merchantName: null,
          memo: '공동구매 참여취소 환불',
        }],
      },
    })

    const store = useTransactionStore()
    await store.fetchRecentTransactions()

    expect(store.recentTransactions[0]).toMatchObject({
      id: '21',
      amount: 28000,
    })
  })

  it('기존 직접 충전 거래은 충전 수단을 직접 충전으로 표시한다', async () => {
    transactionApi.getTransaction.mockResolvedValue({
      data: {
        result: {
          ...backendTransaction,
          transactionId: '19',
          txnType: 'DEPOSIT',
          amount: 30000,
          category: null,
          memo: '지갑 충전',
        },
      },
    })

    const store = useTransactionStore()
    await store.fetchTransaction('19')

    expect(store.currentTxn.chargeMethod).toBe('직접 충전')
  })

  it('본인 계좌 출금은 월 지출과 카테고리 집계에서 제외한다', async () => {
    transactionApi.getTransactions.mockResolvedValue({
      data: {
        result: {
          transactions: [
            backendTransaction,
            {
              ...backendTransaction,
              transactionId: '20',
              txnType: 'WITHDRAW',
              amount: 10000,
              category: null,
              petId: null,
              merchantName: 'KB국민은행',
              memo: '내 계좌로 출금',
            },
          ],
          nextCursor: null,
        },
      },
    })

    const store = useTransactionStore()
    await store.fetchTransactions({ period: '2026-08' })

    expect(store.monthlyExpenseTotal(2026, 8)).toBe(42000)
    expect(store.categoryBreakdown(2026, 8)).toHaveLength(1)
    expect(store.categoryBreakdown(2026, 8)[0]).toMatchObject({
      key: 'MEDICAL',
      amount: 42000,
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
