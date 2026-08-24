import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  kakaoLogin: vi.fn(),
  completeKakaoSignup: vi.fn(),
  refresh: vi.fn(),
  fetchProfile: vi.fn(),
  clearProfile: vi.fn(),
  setHasSimplePassword: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    login: mocks.login,
    kakaoLogin: mocks.kakaoLogin,
    completeKakaoSignup: mocks.completeKakaoSignup,
    refresh: mocks.refresh,
  },
}))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => ({
    fetchProfile: mocks.fetchProfile,
    clearProfile: mocks.clearProfile,
  }),
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    setHasSimplePassword: mocks.setHasSimplePassword,
  }),
}))

vi.mock('@/router', () => ({
  default: {
    push: mocks.routerPush,
  },
}))

import { useAuthStore } from './auth'
import { usePaymentStore } from './payment'

const REGISTRATION_TOKEN_KEY = 'kakaoRegistrationToken'

describe('useAuthStore Kakao OAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.fetchProfile.mockResolvedValue({ id: 1, provider: 'KAKAO' })
  })

  it('기존 Kakao 회원은 토큰을 저장하고 기존 프로필 조회를 완료한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: 'dummy-access-token',
          refreshToken: 'dummy-refresh-token',
          registrationToken: null,
        },
      },
    })
    const store = useAuthStore()
    store.startKakaoRegistration('stale-registration-token')

    const result = await store.kakaoLogin('dummy-code')

    expect(result.authStatus).toBe('LOGIN_COMPLETE')
    expect(store.accessToken).toBe('dummy-access-token')
    expect(store.user).toEqual({ id: 1, provider: 'KAKAO' })
    expect(localStorage.getItem('accessToken')).toBe('dummy-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('dummy-refresh-token')
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).toHaveBeenCalledOnce()
  })

  it('복구된 Kakao 회원은 기존 로그인 완료 흐름으로 토큰과 프로필을 동기화한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        result: {
          authStatus: 'ACCOUNT_RESTORED',
          accessToken: 'restored-access-token',
          refreshToken: 'restored-refresh-token',
          registrationToken: null,
        },
      },
    })
    const store = useAuthStore()
    store.startKakaoRegistration('stale-registration-token')

    const result = await store.kakaoLogin('dummy-code')

    expect(result.authStatus).toBe('ACCOUNT_RESTORED')
    expect(store.accessToken).toBe('restored-access-token')
    expect(store.user).toEqual({ id: 1, provider: 'KAKAO' })
    expect(localStorage.getItem('accessToken')).toBe('restored-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('restored-refresh-token')
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).toHaveBeenCalledOnce()
  })

  it.each([
    { name: 'accessToken 누락', accessToken: null, refreshToken: 'restored-refresh-token', registrationToken: null },
    { name: 'accessToken 비정상 문자열', accessToken: 'undefined', refreshToken: 'restored-refresh-token', registrationToken: null },
    { name: 'refreshToken 누락', accessToken: 'restored-access-token', refreshToken: null, registrationToken: null },
    { name: 'registrationToken 필드 누락', accessToken: 'restored-access-token', refreshToken: 'restored-refresh-token' },
    { name: '빈 registrationToken', accessToken: 'restored-access-token', refreshToken: 'restored-refresh-token', registrationToken: '' },
    { name: 'registrationToken 잔존', accessToken: 'restored-access-token', refreshToken: 'restored-refresh-token', registrationToken: 'unexpected-token' },
  ])('ACCOUNT_RESTORED의 $name 응답은 fail-closed 처리한다', async (response) => {
    localStorage.setItem('accessToken', 'stale-access-token')
    localStorage.setItem('refreshToken', 'stale-refresh-token')
    mocks.kakaoLogin.mockResolvedValue({
      data: { result: { authStatus: 'ACCOUNT_RESTORED', ...response } },
    })
    const store = useAuthStore()
    store.accessToken = 'stale-access-token'

    await expect(store.kakaoLogin('dummy-code')).rejects.toThrow()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('정상 LOCAL 로그인이 stale Kakao 가입 세션을 제거한다', async () => {
    mocks.login.mockResolvedValue({
      data: {
        result: {
          accessToken: 'local-access-token',
          refreshToken: 'local-refresh-token',
        },
      },
    })
    mocks.fetchProfile.mockResolvedValueOnce({ id: 2, provider: 'LOCAL' })
    const store = useAuthStore()
    store.startKakaoRegistration('stale-registration-token')

    await store.login('user@example.com', 'dummy-password')

    expect(store.accessToken).toBe('local-access-token')
    expect(store.user).toEqual({ id: 2, provider: 'LOCAL' })
    expect(localStorage.getItem('accessToken')).toBe('local-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('local-refresh-token')
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
  })

  it.each([
    {
      name: 'accessToken이 undefined',
      result: { accessToken: undefined, refreshToken: 'valid-refresh-token' },
    },
    {
      name: 'accessToken이 undefined 문자열',
      result: { accessToken: 'undefined', refreshToken: 'valid-refresh-token' },
    },
    {
      name: 'accessToken이 null 문자열',
      result: { accessToken: 'null', refreshToken: 'valid-refresh-token' },
    },
    {
      name: 'accessToken이 공백',
      result: { accessToken: '   ', refreshToken: 'valid-refresh-token' },
    },
    {
      name: 'refreshToken이 undefined',
      result: { accessToken: 'valid-access-token', refreshToken: undefined },
    },
    {
      name: 'refreshToken이 undefined 문자열',
      result: { accessToken: 'valid-access-token', refreshToken: 'undefined' },
    },
    {
      name: 'refreshToken이 null 문자열',
      result: { accessToken: 'valid-access-token', refreshToken: 'null' },
    },
    {
      name: 'refreshToken이 공백',
      result: { accessToken: 'valid-access-token', refreshToken: '   ' },
    },
  ])('LOCAL 로그인 응답의 $name이면 fail-closed 처리한다', async ({ result }) => {
    mocks.login.mockResolvedValue({ data: { result } })
    const store = useAuthStore()
    store.accessToken = 'stale-access-token'
    store.user = { id: 99 }
    localStorage.setItem('accessToken', 'stale-access-token')
    localStorage.setItem('refreshToken', 'stale-refresh-token')
    store.startKakaoRegistration('stale-registration-token')

    await expect(
      store.login('user@example.com', 'dummy-password'),
    ).rejects.toThrow('로그인 응답을 확인할 수 없습니다.')

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('유효한 persisted token을 인증 상태로 복원한다', () => {
    localStorage.setItem('accessToken', 'persisted-access-token')
    localStorage.setItem('refreshToken', 'persisted-refresh-token')

    const store = useAuthStore()

    expect(store.accessToken).toBe('persisted-access-token')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('accessToken')).toBe('persisted-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('persisted-refresh-token')
  })

  it.each(['undefined', 'null', '   '])(
    'persisted accessToken %j은 인증 상태로 복원하지 않고 token storage를 정리한다',
    (accessToken) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', 'persisted-refresh-token')

      const store = useAuthStore()

      expect(store.accessToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    },
  )

  it('malformed persisted refreshToken은 제거하고 유효한 accessToken만 복원한다', () => {
    localStorage.setItem('accessToken', 'persisted-access-token')
    localStorage.setItem('refreshToken', 'undefined')

    const store = useAuthStore()

    expect(store.accessToken).toBe('persisted-access-token')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('accessToken')).toBe('persisted-access-token')
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('Pinia state에 malformed accessToken이 들어와도 인증 상태로 판단하지 않는다', () => {
    const store = useAuthStore()

    store.accessToken = 'undefined'

    expect(store.isAuthenticated).toBe(false)
  })

  it('유효한 refreshToken으로 store refresh 요청을 수행한다', async () => {
    localStorage.setItem('accessToken', 'old-access-token')
    localStorage.setItem('refreshToken', 'valid-refresh-token')
    mocks.refresh.mockResolvedValue({
      data: {
        result: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    })
    const store = useAuthStore()

    await store.refreshToken()

    expect(mocks.refresh).toHaveBeenCalledWith('valid-refresh-token')
    expect(store.accessToken).toBe('new-access-token')
    expect(localStorage.getItem('accessToken')).toBe('new-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token')
  })

  it.each([undefined, 'undefined', 'null', '   '])(
    'malformed refreshToken %j이면 store refresh API를 호출하지 않고 정리한다',
    async (refreshToken) => {
      localStorage.setItem('accessToken', 'valid-access-token')
      localStorage.setItem('refreshToken', 'initial-refresh-token')
      const store = useAuthStore()
      if (refreshToken === undefined) {
        localStorage.removeItem('refreshToken')
      } else {
        localStorage.setItem('refreshToken', refreshToken)
      }

      await expect(store.refreshToken()).rejects.toThrow(
        'No valid refresh token',
      )

      expect(mocks.refresh).not.toHaveBeenCalled()
      expect(store.accessToken).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    },
  )

  it('clearSession이 JWT와 stale Kakao 가입 세션을 함께 제거한다', () => {
    const store = useAuthStore()
    store.accessToken = 'dummy-access-token'
    store.user = { id: 1 }
    localStorage.setItem('accessToken', 'dummy-access-token')
    localStorage.setItem('refreshToken', 'dummy-refresh-token')
    store.startKakaoRegistration('stale-registration-token')

    store.clearSession()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.clearProfile).toHaveBeenCalledOnce()
    expect(mocks.setHasSimplePassword).toHaveBeenCalledWith(false)
  })

  it('clearSession이 진행 중인 정기결제 등록 멱등키도 지운다', () => {
    const paymentStore = usePaymentStore()
    paymentStore.pendingCreateKey = 'rec-1'
    paymentStore.pendingCreateSignature = 'pet-1:사료:1000:15:FOOD'
    sessionStorage.setItem(
      'pendingRecurringCreate',
      JSON.stringify({ key: 'rec-1', signature: 'pet-1:사료:1000:15:FOOD' }),
    )
    const store = useAuthStore()

    store.clearSession()

    expect(sessionStorage.getItem('pendingRecurringCreate')).toBeNull()
    expect(paymentStore.pendingCreateKey).toBeNull()
    expect(paymentStore.pendingCreateSignature).toBe('')
  })

  it('잘못된 Kakao LOGIN_COMPLETE 응답은 기존 인증과 stale 가입 세션을 제거한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: null,
          refreshToken: 'dummy-refresh-token',
        },
      },
    })
    const store = useAuthStore()
    store.accessToken = 'stale-access-token'
    localStorage.setItem('accessToken', 'stale-access-token')
    localStorage.setItem('refreshToken', 'stale-refresh-token')
    store.startKakaoRegistration('stale-registration-token')

    await expect(store.kakaoLogin('dummy-code')).rejects.toThrow(
      '카카오 로그인 응답을 확인할 수 없습니다.',
    )

    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('비정상 refreshToken의 Kakao LOGIN_COMPLETE 응답은 fail-closed 처리한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: 'new-access-token',
          refreshToken: 'null',
        },
      },
    })
    const store = useAuthStore()
    store.accessToken = 'stale-access-token'
    localStorage.setItem('accessToken', 'stale-access-token')
    localStorage.setItem('refreshToken', 'stale-refresh-token')

    await expect(store.kakaoLogin('dummy-code')).rejects.toThrow(
      '카카오 로그인 응답을 확인할 수 없습니다.',
    )

    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('Kakao LOGIN_COMPLETE 후 프로필 조회가 실패하면 발급받은 인증 상태를 제거한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          registrationToken: null,
        },
      },
    })
    mocks.fetchProfile.mockRejectedValueOnce(new Error('profile failed'))
    const store = useAuthStore()

    await expect(store.kakaoLogin('dummy-code')).rejects.toThrow('profile failed')

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('신규 Kakao 회원은 registrationToken만 현재 탭에 저장한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        authStatus: 'ADDITIONAL_INFO_REQUIRED',
        accessToken: null,
        refreshToken: null,
        registrationToken: 'dummy-registration-token',
      },
    })
    const store = useAuthStore()

    const result = await store.kakaoLogin('dummy-code')

    expect(result.authStatus).toBe('ADDITIONAL_INFO_REQUIRED')
    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.registrationToken).toBe('dummy-registration-token')
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBe(
      'dummy-registration-token',
    )
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('새 registrationToken으로 이전 가입 세션 값을 교체한다', async () => {
    sessionStorage.setItem(REGISTRATION_TOKEN_KEY, 'old-registration-token')
    setActivePinia(createPinia())
    mocks.kakaoLogin.mockResolvedValue({
      data: {
        authStatus: 'ADDITIONAL_INFO_REQUIRED',
        accessToken: null,
        refreshToken: null,
        registrationToken: 'new-registration-token',
      },
    })
    const store = useAuthStore()

    await store.kakaoLogin('dummy-code')

    expect(store.registrationToken).toBe('new-registration-token')
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBe(
      'new-registration-token',
    )
  })

  it.each([
    {
      name: 'registrationToken이 없는 신규 회원 응답',
      response: {
        authStatus: 'ADDITIONAL_INFO_REQUIRED',
        registrationToken: null,
      },
    },
    {
      name: 'registrationToken이 문자열이 아닌 신규 회원 응답',
      response: {
        authStatus: 'ADDITIONAL_INFO_REQUIRED',
        registrationToken: 1234,
      },
    },
    {
      name: 'accessToken이 없는 로그인 완료 응답',
      response: {
        authStatus: 'LOGIN_COMPLETE',
        accessToken: null,
        refreshToken: 'dummy-refresh-token',
      },
    },
    {
      name: 'refreshToken이 없는 로그인 완료 응답',
      response: {
        authStatus: 'LOGIN_COMPLETE',
        accessToken: 'dummy-access-token',
        refreshToken: undefined,
      },
    },
    {
      name: '빈 accessToken이 포함된 로그인 완료 응답',
      response: {
        authStatus: 'LOGIN_COMPLETE',
        accessToken: '   ',
        refreshToken: 'dummy-refresh-token',
      },
    },
    {
      name: '알 수 없는 authStatus 응답',
      response: {
        authStatus: 'UNKNOWN',
        accessToken: 'dummy-access-token',
        refreshToken: 'dummy-refresh-token',
      },
    },
    {
      name: 'authStatus가 없는 응답',
      response: {},
    },
    {
      name: '응답 본문이 null인 경우',
      response: null,
    },
  ])('$name은 fail-closed 처리한다', async ({ response }) => {
    mocks.kakaoLogin.mockResolvedValue({ data: response })
    const store = useAuthStore()

    await expect(store.kakaoLogin('dummy-code')).rejects.toThrow(
      '카카오 로그인 응답을 확인할 수 없습니다.',
    )

    expect(store.accessToken).toBeNull()
    expect(store.registrationToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('sessionStorage의 registrationToken을 새 Pinia state로 복구한다', () => {
    sessionStorage.setItem(
      REGISTRATION_TOKEN_KEY,
      'restored-registration-token',
    )
    setActivePinia(createPinia())

    const store = useAuthStore()

    expect(store.registrationToken).toBe('restored-registration-token')
  })

  it('가입 세션 삭제 action이 Pinia와 sessionStorage를 함께 비운다', () => {
    const store = useAuthStore()
    store.startKakaoRegistration('dummy-registration-token')

    store.clearKakaoRegistration()

    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
  })

  it('가입 완료 응답을 검증한 뒤 가입 세션을 지우고 로그인을 완료한다', async () => {
    mocks.completeKakaoSignup.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    })
    const store = useAuthStore()
    store.startKakaoRegistration('dummy-registration-token')

    const result = await store.completeKakaoSignup({
      zipCode: '12345',
      address: '제주특별자치도 제주시 애월읍',
      addressDetail: '',
      terms: true,
      privacy: true,
      marketing: false,
    })

    expect(mocks.completeKakaoSignup).toHaveBeenCalledWith({
      registrationToken: 'dummy-registration-token',
      zipCode: '12345',
      address: '제주특별자치도 제주시 애월읍',
      addressDetail: '',
      terms: true,
      privacy: true,
      marketing: false,
    })
    expect(result.authStatus).toBe('LOGIN_COMPLETE')
    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(store.accessToken).toBe('new-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token')
    expect(mocks.fetchProfile).toHaveBeenCalledOnce()
  })

  it('가입 완료 API가 실패하면 registrationToken을 유지한다', async () => {
    mocks.completeKakaoSignup.mockRejectedValue({ response: { status: 409 } })
    const store = useAuthStore()
    store.startKakaoRegistration('dummy-registration-token')

    await expect(
      store.completeKakaoSignup({
        zipCode: '12345',
        address: '제주시 애월읍',
        addressDetail: '',
        terms: true,
        privacy: true,
        marketing: false,
      }),
    ).rejects.toEqual({ response: { status: 409 } })

    expect(store.registrationToken).toBe('dummy-registration-token')
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBe(
      'dummy-registration-token',
    )
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('토큰이 빠진 가입 완료 응답은 fail-closed 처리하고 가입 세션을 유지한다', async () => {
    mocks.completeKakaoSignup.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: null,
          refreshToken: 'new-refresh-token',
        },
      },
    })
    const store = useAuthStore()
    store.startKakaoRegistration('dummy-registration-token')

    await expect(
      store.completeKakaoSignup({
        zipCode: '12345',
        address: '제주시 애월읍',
        addressDetail: '',
        terms: true,
        privacy: true,
        marketing: false,
      }),
    ).rejects.toThrow('카카오 로그인 응답을 확인할 수 없습니다.')

    expect(store.registrationToken).toBe('dummy-registration-token')
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBe(
      'dummy-registration-token',
    )
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'refreshToken이 빠진 응답',
      result: {
        authStatus: 'LOGIN_COMPLETE',
        accessToken: 'new-access-token',
        refreshToken: null,
      },
    },
    {
      name: '알 수 없는 authStatus 응답',
      result: {
        authStatus: 'UNKNOWN',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    },
  ])(
    '$name은 fail-closed 처리하고 가입 세션을 유지한다',
    async ({ result }) => {
      mocks.completeKakaoSignup.mockResolvedValue({ data: { result } })
      const store = useAuthStore()
      store.startKakaoRegistration('dummy-registration-token')

      await expect(
        store.completeKakaoSignup({
          zipCode: '12345',
          address: '제주시 애월읍',
          addressDetail: '',
          terms: true,
          privacy: true,
          marketing: false,
        }),
      ).rejects.toThrow('카카오 로그인 응답을 확인할 수 없습니다.')

      expect(store.registrationToken).toBe('dummy-registration-token')
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
      expect(mocks.fetchProfile).not.toHaveBeenCalled()
    },
  )

  it('검증된 가입 응답 후 프로필 조회가 실패해도 가입 세션은 복구하지 않는다', async () => {
    mocks.completeKakaoSignup.mockResolvedValue({
      data: {
        result: {
          authStatus: 'LOGIN_COMPLETE',
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    })
    mocks.fetchProfile.mockRejectedValueOnce(new Error('profile failed'))
    const store = useAuthStore()
    store.startKakaoRegistration('dummy-registration-token')

    await expect(
      store.completeKakaoSignup({
        zipCode: '12345',
        address: '제주시 애월읍',
        addressDetail: '',
        terms: true,
        privacy: true,
        marketing: false,
      }),
    ).rejects.toThrow('profile failed')

    expect(store.registrationToken).toBeNull()
    expect(sessionStorage.getItem(REGISTRATION_TOKEN_KEY)).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})
