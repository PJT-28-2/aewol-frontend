import api from './index'

export const recurringApi = {
  getRecurrings(params) {
    return api.get('/recurring', { params })
  },

  createRecurring(data) {
    return api.post('/recurring', data)
  },

  updateRecurring(id, data) {
    return api.put(`/recurring/${id}`, data)
  },

  deleteRecurring(id) {
    return api.delete(`/recurring/${id}`)
  },
}
