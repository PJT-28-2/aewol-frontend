import api from './index'

export const authApi = {
  login(email, password) {
    return api.post('/auth/login', { email, password }, {
      skipAuth: true,
      skipAuthRefresh: true,
    })
  },

  signup(data) {
    return api.post('/auth/signup', data)
  },

  sendSignupCode(email) {
    return api.post('/auth/signup/send-code', { email })
  },

  verifySignupCode(email, verificationCode) {
    return api.post('/auth/signup/verify-code', { email, verificationCode })
  },

  verifyEmail(email, code) {
    return api.post('/auth/verify-email', { email, code })
  },

  kakaoLogin(code) {
    return api.post('/auth/oauth/kakao', null, {
      params: { code },
      skipAuth: true,
      skipAuthRefresh: true,
    })
  },

  refresh(refreshToken) {
    return api.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
      skipAuth: true,
      skipAuthRefresh: true,
      useExplicitAuthorization: true,
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

}
