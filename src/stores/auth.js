import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { useMemberStore } from '@/stores/member'
import { useAccountStore } from '@/stores/account'
import { usePaymentStore } from '@/stores/payment'
import { resetUserStores } from '@/stores/resetUserStores'
import router from '@/router'
import { decodeJwtPayload } from '@/utils/jwt'
import { isValidToken } from '@/utils/token'

const unwrapResult = (data) => data?.result ?? data
const KAKAO_REGISTRATION_TOKEN_KEY = 'kakaoRegistrationToken'
export const KAKAO_LOGIN_COMPLETE = 'LOGIN_COMPLETE'
export const KAKAO_ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED'
export const KAKAO_ACCOUNT_RESTORED = 'ACCOUNT_RESTORED'

const getStoredAccessToken = () => {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')

  if (!isValidToken(accessToken)) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return null
  }

  if (refreshToken !== null && !isValidToken(refreshToken)) {
    localStorage.removeItem('refreshToken')
  }

  return accessToken
}

const getStoredKakaoRegistrationToken = () => {
  const token = window.sessionStorage.getItem(KAKAO_REGISTRATION_TOKEN_KEY)
  return isValidToken(token) ? token : null
}

const invalidKakaoLoginResponse = () =>
  new Error('카카오 로그인 응답을 확인할 수 없습니다.')

const assertKakaoLoginComplete = (result) => {
  const isAuthenticatedStatus =
    result?.authStatus === KAKAO_LOGIN_COMPLETE ||
    result?.authStatus === KAKAO_ACCOUNT_RESTORED
  if (
    !result ||
    typeof result !== 'object' ||
    !isAuthenticatedStatus ||
    (result.authStatus === KAKAO_ACCOUNT_RESTORED && result.registrationToken !== null) ||
    !isValidToken(result.accessToken) ||
    !isValidToken(result.refreshToken)
  ) {
    throw invalidKakaoLoginResponse()
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: getStoredAccessToken(),
    registrationToken: getStoredKakaoRegistrationToken(),
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => isValidToken(state.accessToken),
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

    /**
     * 로그인한 회원 정보를 갈아끼운다.
     *
     * <p>밖에서 user에 직접 대입하면, 나중에 이 값이 바뀔 때 함께 해야 할 일이
     * 생겨도 그 대입 지점들을 찾아 고치기 어렵다. 통로를 하나로 둔다.
     */
    setUser(user) {
      this.user = user
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
      window.sessionStorage.removeItem('pendingRecurringCreate')
      useMemberStore().clearProfile()
      // 로그아웃/세션 종료 시 간편비밀번호 로컬 상태도 같이 지운다. fetchProfile이
      // 다시 호출될 때 서버 값으로 동기화되긴 하지만, 로그아웃 직후처럼 그 호출이
      // 바로 일어나지 않는 화면에서 이전 계정의 PIN 설정 흔적이 남지 않도록
      // 여기서도 한번 더 초기화해준다(2026-08-13, defense-in-depth).
      useAccountStore().setHasSimplePassword(false)
      // sessionStorage만 지우면 이미 만들어진 payment store의 멱등키가 메모리에
      // 남아, 새로고침 없이 다른 계정으로 같은 내용을 등록할 때 이전 키가 재사용된다.
      usePaymentStore().clearCreateKey()
      // 토큰만 지우고 기부·정기결제·반려동물 등을 남기면, 같은 브라우저에서 다음
      // 계정이 이전 조회 결과와 캐시 플래그를 그대로 쓴다. 세션 epoch를 올려
      // 로그아웃 전에 떠난 요청이 새 세션을 다시 채우지 못하게 한다.
      resetUserStores()
    },

    async login(email, password) {
      const { data } = await authApi.login(email, password)
      const result = unwrapResult(data)

      if (
        !isValidToken(result?.accessToken) ||
        !isValidToken(result?.refreshToken)
      ) {
        this.clearSession()
        throw new Error('로그인 응답을 확인할 수 없습니다.')
      }

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

      try {
        assertKakaoLoginComplete(result)
      } catch (error) {
        this.clearSession()
        throw error
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
      if (!isValidToken(refreshToken)) {
        this.clearSession()
        throw new Error('No valid refresh token')
      }

      const { data } = await authApi.refresh(refreshToken)
      const result = unwrapResult(data)
      if (!isValidToken(result?.accessToken)) {
        this.clearSession()
        throw new Error('Invalid refresh response')
      }
      this.accessToken = result.accessToken
      localStorage.setItem('accessToken', result.accessToken)
      if (isValidToken(result.refreshToken)) {
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
