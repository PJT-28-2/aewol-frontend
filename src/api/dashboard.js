import api from './index'

export const dashboardApi = {
  getSummary(params) {
    return api.get('/dashboard/summary', { params })
  },

  getTrend(params) {
    return api.get('/dashboard/trend', { params })
  },

  getComparison(params) {
    return api.get('/dashboard/comparison', { params })
  },

  getByPet(petId, params) {
    return api.get(`/dashboard/pet/${petId}`, { params })
  },
}
