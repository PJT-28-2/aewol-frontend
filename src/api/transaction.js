import api from './index'

export const transactionApi = {
  createPayment(data) {
    return api.post('/transactions/payment', data)
  },

  getTransactions(params) {
    return api.get('/transactions', { params })
  },

  getTransaction(id) {
    return api.get(`/transactions/${id}`)
  },

  updateCategory(id, category) {
    return api.patch(`/transactions/${id}/category`, { category })
  },

  deleteTransaction(id) {
    return api.delete(`/transactions/${id}`)
  },
}
