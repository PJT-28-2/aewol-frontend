import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import router from '@/router'

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
    },

    async login(email, password) {
      const { data } = await authApi.login(email, password)
      this.accessToken = data.accessToken
      this.user = data.user ?? null
      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      return data
    },

    async kakaoLogin(code) {
      const { data } = await authApi.kakaoLogin(code)
      this.accessToken = data.accessToken
      this.user = data.user ?? null
      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      return data
    },

    async signup(signupData) {
      const { data } = await authApi.signup(signupData)
      return data
    },

    async verifyEmail(email, code) {
      const { data } = await authApi.verifyEmail(email, code)
      return data
    },

    async refreshToken() {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await authApi.refresh(refreshToken)
      this.accessToken = data.accessToken
      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      return data
    },

    logout() {
      authApi.logout().catch(() => {})
      this.clearSession()
      router.push('/login')
    },

    async withdraw() {
      await authApi.withdraw()
      this.clearSession()
    },
  },
})
