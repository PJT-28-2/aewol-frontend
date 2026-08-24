import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { useMemberStore } from '@/stores/member'
import { useAccountStore } from '@/stores/account'
import router from '@/router'
import { decodeJwtPayload } from '@/utils/jwt'

const unwrapResult = (data) => data?.result ?? data
const KAKAO_REGISTRATION_TOKEN_KEY = 'kakaoRegistrationToken'
export const KAKAO_LOGIN_COMPLETE = 'LOGIN_COMPLETE'
export const KAKAO_ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED'

const isValidToken = (token) =>
  typeof token === 'string' && token.trim().length > 0

const getStoredKakaoRegistrationToken = () => {
  const token = window.sessionStorage.getItem(KAKAO_REGISTRATION_TOKEN_KEY)
  return isValidToken(token) ? token : null
}

const invalidKakaoLoginResponse = () =>
  new Error('카카오 로그인 응답을 확인할 수 없습니다.')

const assertKakaoLoginComplete = (result) => {
  if (
    !result ||
    typeof result !== 'object' ||
    result.authStatus !== KAKAO_LOGIN_COMPLETE ||
    !isValidToken(result.accessToken) ||
    !isValidToken(result.refreshToken)
  ) {
    throw invalidKakaoLoginResponse()
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    registrationToken: getStoredKakaoRegistrationToken(),
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
    startKakaoRegistration(registrationToken) {
      if (!isValidToken(registrationToken)) {
        throw invalidKakaoLoginResponse()
      }

      this.registrationToken = registrationToken
      window.sessionStorage.setItem(
        KAKAO_REGISTRATION_TOKEN_KEY,
        registrationToken,
      )
    },

    clearKakaoRegistration() {
      this.registrationToken = null
      window.sessionStorage.removeItem(KAKAO_REGISTRATION_TOKEN_KEY)
    },

    clearSession() {
      this.clearKakaoRegistration()
      this.accessToken = null
      this.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.sessionStorage.removeItem('profileEditPasswordVerified')
      window.sessionStorage.removeItem('kakaoOAuthState')
      window.sessionStorage.removeItem('tossCustomerKey')
      window.sessionStorage.removeItem('pendingTossCharge')
      window.sessionStorage.removeItem('completedTossCharge')
      window.sessionStorage.removeItem('pendingWalletWithdrawal')
      useMemberStore().clearProfile()
      // 로그아웃/세션 종료 시 간편비밀번호 로컬 상태도 같이 지운다. fetchProfile이
      // 다시 호출될 때 서버 값으로 동기화되긴 하지만, 로그아웃 직후처럼 그 호출이
      // 바로 일어나지 않는 화면에서 이전 계정의 PIN 설정 흔적이 남지 않도록
      // 여기서도 한번 더 초기화해준다(2026-08-13, defense-in-depth).
      useAccountStore().setHasSimplePassword(false)
      // 간편 비밀번호 재설정 진행 상태(resetting.currentPassword/pendingPassword)도 같이
      // 지운다 — 안 지우면 재설정 1단계(현재 PIN 확인)만 통과한 채로 로그아웃했을 때,
      // 같은 브라우저에서 다른 계정으로 로그인해도 이 값이 남아있어서 라우트 가드가
      // 이전 계정 상태로 본인확인 단계를 건너뛰게 만든다(#425).
      useAccountStore().resetSimplePasswordResetState()
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
      this.clearKakaoRegistration()
      return result
    },

    async finishKakaoLogin(result) {
      assertKakaoLoginComplete(result)

      this.accessToken = result.accessToken
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      try {
        this.user = await useMemberStore().fetchProfile()
      } catch (error) {
        this.clearSession()
        throw error
      }
      this.clearKakaoRegistration()
      return result
    },

    async kakaoLogin(code) {
      const { data } = await authApi.kakaoLogin(code)
      const result = unwrapResult(data)

      if (!result || typeof result !== 'object') {
        throw invalidKakaoLoginResponse()
      }

      if (result.authStatus === KAKAO_ADDITIONAL_INFO_REQUIRED) {
        this.startKakaoRegistration(result.registrationToken)
        return result
      }

      return this.finishKakaoLogin(result)
    },

    async completeKakaoSignup(signupData) {
      if (!isValidToken(this.registrationToken)) {
        throw invalidKakaoLoginResponse()
      }

      const { data } = await authApi.completeKakaoSignup({
        ...signupData,
        registrationToken: this.registrationToken,
      })
      const result = unwrapResult(data)

      assertKakaoLoginComplete(result)
      this.clearKakaoRegistration()
      return this.finishKakaoLogin(result)
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
