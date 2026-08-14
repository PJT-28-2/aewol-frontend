import api from './index'

// MemberController가 마이페이지 리팩토링 때 /api/members → /api/users로 이동했고,
// getMyInfo/updateMyInfo도 PUT에서 PATCH로 바뀌었어요(2026-08-11 재확인).
export const memberApi = {
  getProfile() {
    return api.get('/users/me')
  },

  updateProfile(data) {
    return api.patch('/users/me', data)
  },

  getNotificationSettings() {
    return api.get('/users/me/settings/notifications')
  },

  updateNotificationSettings(data) {
    return api.patch('/users/me/settings/notifications', data)
  },

  verifyPassword(currentPassword) {
    return api.post('/users/me/password/verify', { currentPassword })
  },

  changePassword(currentPassword, newPassword) {
    return api.patch('/users/me/password', { currentPassword, newPassword })
  },

  withdraw(currentPassword) {
    const config = currentPassword
      ? { data: { currentPassword } }
      : undefined
    return api.delete('/users/me', config)
  },
}
