import api from './index'

export const recurringApi = {
  getRecurrings(params) {
    return api.get('/recurring-payments', { params })
  },

  createRecurring(data) {
    return api.post('/recurring-payments', data)
  },

  updateRecurring(id, data) {
    return api.put(`/recurring-payments/${id}`, data)
  },

  deleteRecurring(id) {
    return api.delete(`/recurring-payments/${id}`)
  },
}
