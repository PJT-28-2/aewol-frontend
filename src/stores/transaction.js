import { acceptHMRUpdate, defineStore } from 'pinia'
import { transactionApi } from '@/api/transaction'
import { CATEGORY_LABELS, mockTransactions } from '@/mocks/transaction'
import { usePetStore } from '@/stores/pet'

function isSameMonth(dateStr, year, month) {
  const [txYear, txMonth] = dateStr.split('-').map(Number)
  return txYear === year && txMonth === month
}

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: mockTransactions.map((tx) => ({ ...tx })),
    currentTxn: null,
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
          .filter((tx) => tx.petId === petId)
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
    async fetchTransactions(params) {
      const { data } = await transactionApi.getTransactions(params)
      this.transactions = data
      return data
    },

    async fetchTransaction(id) {
      const { data } = await transactionApi.getTransaction(id)
      this.currentTxn = data
      return data
    },

    async createPayment(paymentData) {
      const { data } = await transactionApi.createPayment(paymentData)
      this.transactions.unshift(data)
      return data
    },

    // TODO: 백엔드 API 연동 후 실제 지출 태깅 수정 API로 교체
    updateTransactionTag(id, { category, petId }) {
      const tx = this.transactions.find((t) => t.id === id)
      if (!tx) return

      tx.category = category
      tx.petId = petId
      tx.autoTagged = false

      const petStore = usePetStore()
      const pet = petStore.pets.find((p) => p.id === petId)
      tx.subtitle = pet
        ? `${CATEGORY_LABELS[category]} · ${pet.name}`
        : CATEGORY_LABELS[category]
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTransactionStore, import.meta.hot))
}
