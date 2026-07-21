import api from './index'

export const memberApi = {
  getProfile() {
    return api.get('/members/me')
  },

  updateProfile(data) {
    return api.put('/members/me', data)
  },
}
