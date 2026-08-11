import api from './index'

export const authApi = {
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },

  signup(data) {
    return api.post('/auth/signup', data)
  },

  verifyEmail(email, code) {
    return api.post('/auth/verify-email', { email, code })
  },

  kakaoLogin(code) {
    return api.post('/auth/kakao', { code })
  },

  refresh(refreshToken) {
    // 백엔드는 refreshToken을 Authorization: Bearer 헤더에서 읽는다.
    return api.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
  },

  logout() {
    return api.post('/auth/logout')
  },

  resetPasswordRequest(email) {
    return api.post('/auth/password/reset-request', { email })
  },

  resetPassword(data) {
    return api.post('/auth/password/reset', data)
  },

  withdraw() {
    return api.delete('/auth/withdraw')
  },
}
