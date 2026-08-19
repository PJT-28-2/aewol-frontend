import api from './index'

// 실제 백엔드(aewol-backend RecurringController) 기준: /api/recurring (GET/POST/PUT/DELETE)
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
