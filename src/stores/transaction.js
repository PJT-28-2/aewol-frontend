import { defineStore } from 'pinia'
import { transactionApi } from '@/api/transaction'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [],
    currentTxn: null,
  }),

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
  },
})
