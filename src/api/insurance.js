import api from './index'

export const insuranceApi = {
  simulate(data) {
    return api.post('/insurance/simulate', data)
  },

  getSimulations(params) {
    return api.get('/insurance/simulations', { params })
  },

  submitClaim(data) {
    return api.post('/insurance/claims', data)
  },

  getClaims(params) {
    return api.get('/insurance/claims', { params })
  },

  getClaim(id) {
    return api.get(`/insurance/claims/${id}`)
  },

  confirmClaim(id) {
    return api.post(`/insurance/claims/${id}/confirm`)
  },
}
