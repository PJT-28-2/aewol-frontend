import api from './index'

export const donationApi = {
  getOverview() {
    return api.get('/donation')
  },

  getPot() {
    return api.get('/donation/pot')
  },

  withdrawPot(amount) {
    return api.post('/donation/pot/withdraw', { amount })
  },

  donate(data) {
    return api.post('/donation', data)
  },

  saveSettings(data) {
    return api.put('/donation/settings', data)
  },

  addPreference(organizationId) {
    return api.put(`/donation/preferences/${organizationId}`)
  },

  removePreference(organizationId) {
    return api.delete(`/donation/preferences/${organizationId}`)
  },

  getHistory(params) {
    return api.get('/donation/history', { params })
  },
}
