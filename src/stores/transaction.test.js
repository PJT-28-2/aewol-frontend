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
      subtitle: '지갑 충전 (TossPayments)',
    })
  })

  it('일반 거래(결제 등)의 부제목은 memo 없이 카테고리 라벨만 표시한다 (#354)', async () => {
    transactionApi.getRecentTransactions.mockResolvedValue({
      data: { result: [backendTransaction] },
    })

    const store = useTransactionStore()
    await store.fetchRecentTransactions()

    // backendTransaction은 category: 'HOSPITAL'(-> '병원비'), memo: '진료비'를 갖는다.
    // memo가 리스트에 노출되면 공동구매 참여 같은 상세 정보가 그대로 보여, 부제목은
    // 카테고리 라벨만 남긴다 — memo는 거래 상세 화면(TransactionDetailView)에서 별도로 보여준다
    expect(store.recentTransactions[0].subtitle).toBe('병원비')
  })

  it('기존 공동구매 결제는 긴 상품명 대신 공동구매 결제로 표시한다', async () => {
    transactionApi.getRecentTransactions.mockResolvedValue({
      data: {
        result: [{
          ...backendTransaction,
          merchantName: '아이펫유 제니쥬 밸런스케어 강아지 유산균 영양제 장건강 구강 피부 건강 60정',
          memo: '공동구매 참여: 아이펫유 제니쥬 밸런스케어 강아지 유산균 영양제 장건강 구강 피부 건강 60정',
        }],
      },
    })

    const store = useTransactionStore()
    await store.fetchRecentTransactions()

    expect(store.recentTransactions[0].title).toBe('공동구매 결제')
    expect(store.recentTransactions[0].memo).toContain('아이펫유 제니쥬')
  })

  it('환불(REFUND) 거래는 양수 금액으로 변환하고, "충전"/"출금" 어느 필터 타입에도 속하지 않는 별도 type을 갖는다', async () => {
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

    // amount만 양수로 바뀌고 type이 'charge'/'withdraw' 둘 중 하나로 남으면, WalletView/
    // TransactionHistoryView의 "충전"/"출금" 필터 탭 어느 한쪽에 잘못 걸리게 된다 —
    // "전체" 탭에서만 보이도록 별도 type('refund')이어야 한다
    // 환불은 실제 소비 카테고리가 없는데도 category가 항상 'ETC'로 떨어져, 그대로 두면
    // 부제목에 "기타"만 떠서 뭔가로 분류된 것처럼 오해를 준다 — 부제목은 비운다 (#354)
    expect(store.recentTransactions[0]).toMatchObject({
      id: '21',
      amount: 28000,
      type: 'refund',
      title: '공동구매 환불',
      subtitle: '',
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
