import api from './index'

export const memberApi = {
  getProfile() {
    return api.get('/users/me')
  },

  updateProfile(data) {
    return api.patch('/users/me', data)
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
