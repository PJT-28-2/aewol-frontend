import api from './index'

export const accountApi = {
  connect(data) {
    return api.post('/accounts/connect', data)
  },

  getAccounts() {
    return api.get('/accounts')
  },

  getAccount(id) {
    return api.get(`/accounts/${id}`)
  },

  setPrimary(id) {
    return api.patch(`/accounts/${id}/primary`)
  },

  disconnect(id) {
    return api.delete(`/accounts/${id}`)
  },

  getBalance(id) {
    return api.get(`/accounts/${id}/balance`)
  },
}
