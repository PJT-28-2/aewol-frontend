import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { useMemberStore } from '@/stores/member'
import router from '@/router'

const unwrapResult = (data) => data.result ?? data

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    clearSession() {
      this.accessToken = null
      this.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.sessionStorage.removeItem('profileEditPasswordVerified')
      window.sessionStorage.removeItem('kakaoOAuthState')
      useMemberStore().clearProfile()
    },

    async login(email, password) {
      const { data } = await authApi.login(email, password)
      const result = unwrapResult(data)
      this.accessToken = result.accessToken
      localStorage.setItem('accessToken', result.accessToken)
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken)
      }
      try {
        this.user = await useMemberStore().fetchProfile()
      } catch (error) {
        this.clearSession()
        throw error
      }
      return result
    },

    async kakaoLogin(code) {
      const { data } = await authApi.kakaoLogin(code)
      const result = unwrapResult(data)
      this.accessToken = result.accessToken
      localStorage.setItem('accessToken', result.accessToken)
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken)
      }
      try {
        this.user = await useMemberStore().fetchProfile()
      } catch (error) {
        this.clearSession()
        throw error
      }
      return result
    },

    async signup(signupData) {
      const { data } = await authApi.signup(signupData)
      return data
    },

    async sendSignupCode(email) {
      const { data } = await authApi.sendSignupCode(email)
      return data
    },

    async verifySignupCode(email, verificationCode) {
      const { data } = await authApi.verifySignupCode(email, verificationCode)
      return data
    },

    async refreshToken() {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await authApi.refresh(refreshToken)
      const result = unwrapResult(data)
      this.accessToken = result.accessToken
      localStorage.setItem('accessToken', result.accessToken)
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken)
      }
      return result
    },

    async logout() {
      try {
        await authApi.logout()
      } finally {
        this.clearSession()
        await router.push('/login')
      }
    },
  },
})
