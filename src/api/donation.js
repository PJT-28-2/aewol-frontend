import api from './index'

export const donationApi = {
  getPot() {
    return api.get('/donation/pot')
  },

  withdrawPot(amount) {
    return api.post('/donation/pot/withdraw', { amount })
  },

  donate(data) {
    return api.post('/donation', data)
  },

  getHistory(params) {
    return api.get('/donation/history', { params })
  },
}
