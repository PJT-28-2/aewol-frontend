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

function isSameMonth(dateStr, year, month) {
  const [txYear, txMonth] = dateStr.split('-').map(Number)
  return txYear === year && txMonth === month
}

function normalizeTransaction(transaction) {
  if (!transaction) return null

  const transactionDate = transaction.transactionDate ?? transaction.txnDate ?? ''
  const [date = '', rawTime = '00:00'] = transactionDate.split(/[T ]/)
  const type = transaction.txnType === 'DEPOSIT' ? 'charge' : 'withdraw'
  const category = UI_CATEGORY_BY_API[transaction.category] ?? transaction.category ?? 'ETC'
  const rawAmount = Number(transaction.amount ?? 0)
  const amount = type === 'charge' ? Math.abs(rawAmount) : -Math.abs(rawAmount)
  const categoryLabel = CATEGORY_LABELS[category] ?? '기타'
  const title = transaction.merchantName
    || (type === 'charge' ? '애월지갑 충전' : transaction.memo)
    || '거래 내역'
  const subtitle = type === 'charge'
    ? transaction.memo || '애월지갑 충전'
    : [categoryLabel, transaction.memo].filter(Boolean).join(' · ')

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
    paymentMethod: transaction.paymentMethod ?? '애월 통합 지갑',
    chargeMethod: transaction.paymentMethod ?? '애월 통합 지갑',
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
    monthWithdrawals: (state) => (year, month) =>
      state.transactions.filter(
        (tx) => tx.type === 'withdraw' && isSameMonth(tx.date, year, month),
      ),

    monthlyExpenseTotal() {
      return (year, month) =>
        this.monthWithdrawals(year, month).reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0,
        )
    },

    petExpenseTotal() {
      return (petId, year, month) =>
        this.monthWithdrawals(year, month)
          .filter((tx) => tx.petId === String(petId))
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    },

    // 이번 달 출금 내역을 category별로 합산 (표시 순서는 거래 발생 순서를 따름)
    categoryBreakdown() {
      return (year, month) => {
        const breakdown = []
        const indexByKey = new Map()

        this.monthWithdrawals(year, month).forEach((tx) => {
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
