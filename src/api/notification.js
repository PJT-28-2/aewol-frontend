import api from './index'

const BASE_URL = '/users/me/notifications'

export const notificationApi = {
  getNotifications(params = {}) {
    return api.get(BASE_URL, { params })
  },

  getUnreadCount() {
    return api.get(`${BASE_URL}/unread-count`)
  },

  markAsRead(notificationId) {
    return api.patch(`${BASE_URL}/${notificationId}/read`)
  },

  markAllAsRead() {
    return api.patch(`${BASE_URL}/read-all`)
  },
}
