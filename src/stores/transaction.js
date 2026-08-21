import { acceptHMRUpdate, defineStore } from 'pinia'
import { transactionApi } from '@/api/transaction'
import { CATEGORY_LABELS } from '@/mocks/transaction'

const UI_CATEGORY_BY_API = {
  HOSPITAL: 'MEDICAL',
  FOOD: 'FOOD',
  GROOMING: 'GROOMING',
  TOY: 'SUPPLIES',
  ETC: 'ETC',
}

const API_CATEGORY_BY_UI = Object.fromEntries(
  Object.entries(UI_CATEGORY_BY_API).map(([apiCategory, uiCategory]) => [
    uiCategory,
    apiCategory,
  ]),
)

// WITHDRAW/PAYMENT처럼 여기 없는 txnType은 전부 'withdraw'(출금 취급)로 떨어진다.
// REFUND는 'charge'로 합치지 않고 별도 값을 둬서, "충전"/"출금" 두 탭짜리 필터
// (WalletView, TransactionHistoryView)의 어느 쪽에도 걸리지 않고 "전체"에서만 보이게 한다
const TYPE_BY_TXN_TYPE = { DEPOSIT: 'charge', REFUND: 'refund' }

function isSameMonth(dateStr, year, month) {
  const [txYear, txMonth] = dateStr.split('-').map(Number)
  return txYear === year && txMonth === month
}

function normalizePaymentMethod(paymentMethod) {
  if (!paymentMethod || ['애월 통합 지갑', '애월통합지갑'].includes(paymentMethod)) {
    return '애월지갑'
  }
  return paymentMethod
}

function normalizeTransaction(transaction) {
  if (!transaction) return null

  const transactionDate = transaction.transactionDate ?? transaction.txnDate ?? ''
  const [date = '', rawTime = '00:00'] = transactionDate.split(/[T ]/)
  const category = UI_CATEGORY_BY_API[transaction.category] ?? transaction.category ?? 'ETC'
  const rawAmount = Number(transaction.amount ?? 0)
  // DEPOSIT(충전)과 REFUND(공동구매 참여취소 환불 등) 둘 다 잔액이 늘어나는 입금이라 금액
  // 부호는 +로 같이 취급한다. type은 TYPE_BY_TXN_TYPE 기준으로 정해지는데, "애월지갑 충전"
  // 문구·충전수단 표시는 REFUND에는 안 맞으므로 그건 isDeposit로 따로 따진다
  const isDeposit = transaction.txnType === 'DEPOSIT'
  const isRefund = transaction.txnType === 'REFUND'
  const isIncoming = isDeposit || isRefund
  const type = TYPE_BY_TXN_TYPE[transaction.txnType] ?? 'withdraw'
  const amount = isIncoming ? Math.abs(rawAmount) : -Math.abs(rawAmount)
  const categoryLabel = CATEGORY_LABELS[category] ?? '기타'
  const title = transaction.merchantName
    || (isDeposit ? '애월지갑 충전' : transaction.memo)
    || '거래 내역'
  // 환불은 실제로 소비 카테고리가 없는데도 category가 항상 'ETC'로 떨어져 부제목에
  // "기타"만 뜨는 게 오해를 준다(뭔가 분류된 것처럼 보임) — 부제목 자체를 비워둔다
  const subtitle = isDeposit
    ? transaction.memo || '애월지갑 충전'
    : isRefund
      ? ''
      : categoryLabel
  const chargeMethod = isDeposit
    ? (transaction.memo?.includes('TossPayments') ? 'TossPayments' : '직접 충전')
    : normalizePaymentMethod(transaction.paymentMethod)

  return {
    ...transaction,
    id: String(transaction.transactionId ?? transaction.txnId ?? transaction.id),
    date,
    time: rawTime.slice(0, 5),
    title,
    subtitle,
    amount,
    type,
    category,
    petId: transaction.petId ? String(transaction.petId) : null,
    paymentMethod: normalizePaymentMethod(transaction.paymentMethod),
    chargeMethod,
    autoTagged: transaction.autoTagged === true || transaction.autoTagged === 'Y',
  }
}

function unwrapResult(response) {
  return response?.data?.result ?? response?.data
}

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [],
    recentTransactions: [],
    currentTxn: null,
    nextCursor: null,
  }),

  getters: {
    monthExpenses: (state) => (year, month) =>
      state.transactions.filter(
        (tx) => tx.txnType === 'PAYMENT' && isSameMonth(tx.date, year, month),
      ),

    monthlyExpenseTotal() {
      return (year, month) =>
        this.monthExpenses(year, month).reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0,
        )
    },

    petExpenseTotal() {
      return (petId, year, month) =>
        this.monthExpenses(year, month)
          .filter((tx) => tx.petId === String(petId))
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    },

    // 이번 달 소비(PAYMENT) 내역만 category별로 합산한다.
    // 본인 계좌로 옮긴 WITHDRAW는 자금 이동이므로 지출 대시보드에서 제외한다.
    categoryBreakdown() {
      return (year, month) => {
        const breakdown = []
        const indexByKey = new Map()

        this.monthExpenses(year, month).forEach((tx) => {
          const amount = Math.abs(tx.amount)
          if (!indexByKey.has(tx.category)) {
            indexByKey.set(tx.category, breakdown.length)
            breakdown.push({
              key: tx.category,
              label: CATEGORY_LABELS[tx.category],
              amount: 0,
              petBreakdown: [],
            })
          }
          const entry = breakdown[indexByKey.get(tx.category)]
          entry.amount += amount

          if (tx.petId) {
            const petEntry = entry.petBreakdown.find((b) => b.petId === tx.petId)
            if (petEntry) petEntry.amount += amount
            else entry.petBreakdown.push({ petId: tx.petId, amount })
          }
        })

        return breakdown
      }
    },
  },

  actions: {
    async fetchTransactions(params, { append = false } = {}) {
      const page = unwrapResult(await transactionApi.getTransactions(params)) ?? {}
      const fetched = (page.transactions ?? []).map(normalizeTransaction)
      this.transactions = append ? [...this.transactions, ...fetched] : fetched
      this.nextCursor = page.nextCursor ?? null
      return fetched
    },

    async fetchRecentTransactions(params = {}) {
      const result = unwrapResult(await transactionApi.getRecentTransactions(params)) ?? []
      this.recentTransactions = result.map(normalizeTransaction)
      return this.recentTransactions
    },

    async fetchTransaction(id) {
      const result = unwrapResult(await transactionApi.getTransaction(id))
      this.currentTxn = normalizeTransaction(result)
      return this.currentTxn
    },

    async createPayment(paymentData) {
      const result = unwrapResult(await transactionApi.createPayment(paymentData))
      const created = normalizeTransaction(result)
      this.transactions.unshift(created)
      return created
    },

    async updateTransactionTag(id, { category, petId }) {
      const apiCategory = API_CATEGORY_BY_UI[category] ?? category
      const result = unwrapResult(await transactionApi.updateTag(id, {
        category: apiCategory,
        petId,
      }))
      const updated = normalizeTransaction(result)
      const index = this.transactions.findIndex((tx) => tx.id === String(id))
      if (index !== -1) this.transactions[index] = updated
      const recentIndex = this.recentTransactions.findIndex((tx) => tx.id === String(id))
      if (recentIndex !== -1) this.recentTransactions[recentIndex] = updated
      this.currentTxn = updated
      return updated
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTransactionStore, import.meta.hot))
}
