import api from './index'

// 실제 백엔드(aewol-backend RecurringController) 기준: /api/recurring (GET/POST/DELETE만 존재, PUT 없음)
export const recurringApi = {
  getRecurrings(params) {
    return api.get('/recurring', { params })
  },

  createRecurring(data) {
    return api.post('/recurring', data)
  },

  deleteRecurring(id) {
    return api.delete(`/recurring/${id}`)
  },
}
