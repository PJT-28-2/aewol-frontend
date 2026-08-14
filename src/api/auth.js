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
    return api.post(
      '/auth/password/reset-request',
      { email },
      {
        skipAuth: true,
        skipAuthRefresh: true,
      },
    )
  },

  resetPasswordVerify(email, verificationCode) {
    return api.post(
      '/auth/password/reset-verify',
      { email, verificationCode },
      {
        skipAuth: true,
        skipAuthRefresh: true,
      },
    )
  },

  resetPassword(resetToken, newPassword) {
    return api.post(
      '/auth/password/reset',
      { resetToken, newPassword },
      {
        skipAuth: true,
        skipAuthRefresh: true,
      },
    )
  },

  requestFindAccountCode(name, phone) {
    return api.post('/auth/account/find/send-code', { name, phone }, {
      skipAuth: true,
      skipAuthRefresh: true,
    })
  },

  verifyFindAccountCode(requestId, verificationCode) {
    return api.post('/auth/account/find/verify-code', { requestId, verificationCode }, {
      skipAuth: true,
      skipAuthRefresh: true,
    })
  },

}
