import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { useMemberStore } from '@/stores/member'
import { useAccountStore } from '@/stores/account'
import router from '@/router'
import { decodeJwtPayload } from '@/utils/jwt'

const unwrapResult = (data) => data.result ?? data

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    // 값은 ADMIN/USER로 확정됨. 클레임 키 이름("role")은 백엔드 JWT 스펙 확정 전 가정치라
    // 실제 스펙이 다르면 이 부분만 맞춰서 수정하면 된다
    role: (state) => decodeJwtPayload(state.accessToken)?.role ?? null,
    isAdmin: (state) => decodeJwtPayload(state.accessToken)?.role === 'ADMIN',
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
      // 로그아웃/세션 종료 시 간편비밀번호 로컬 상태도 같이 지운다. fetchProfile이
      // 다시 호출될 때 서버 값으로 동기화되긴 하지만, 로그아웃 직후처럼 그 호출이
      // 바로 일어나지 않는 화면에서 이전 계정의 PIN 설정 흔적이 남지 않도록
      // 여기서도 한번 더 초기화해준다(2026-08-13, defense-in-depth).
      useAccountStore().setHasSimplePassword(false)
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
