import api from './index'

export const transactionApi = {
  createPayment(data) {
    return api.post('/transactions/payment', data)
  },

  getTransactions(params) {
    return api.get('/transactions', { params })
  },

  getRecentTransactions(params) {
    return api.get('/transactions/recent', { params })
  },

  getTransaction(id) {
    return api.get(`/transactions/${id}`)
  },

  // 결제 재분류(카테고리·반려동물 태그) 저장
  updateTag(id, { category, petId }) {
    return api.put(`/transactions/${id}/tag`, { category, petId })
  },
}
