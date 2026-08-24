import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from './index'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'

const PROTECTED_PATH = '/home'
const ROUTER_RESET_PATH = '/callback/kakao'

const navigateTo = async (path) => {
  await router.push(path)
  await router.isReady()
}

const restorePersistedSession = () => {
  localStorage.setItem('accessToken', 'persisted-access-token')
  localStorage.setItem('refreshToken', 'persisted-refresh-token')

  return {
    authStore: useAuthStore(),
    memberStore: useMemberStore(),
  }
}

const getKakaoAdditionalInfoGuard = () => {
  const route = router
    .getRoutes()
    .find(({ name }) => name === 'KakaoAdditionalInfo')
  return route.beforeEnter
}

const createAccessToken = (role) => {
  const payload = btoa(JSON.stringify({ role }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `header.${payload}.signature`
}

beforeEach(async () => {
  vi.restoreAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  localStorage.clear()
  sessionStorage.clear()

  setActivePinia(createPinia())
  await router.replace(ROUTER_RESET_PATH)
  await router.isReady()

  // Router는 singleton이지만 store는 navigation마다 현재 active Pinia에서 조회한다.
  // 초기 경로 이동에 사용한 store와 테스트 대상 store를 분리해 상태 누수를 막는다.
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Kakao 추가정보 route', () => {
  it('registrationToken이 없으면 로그인 화면으로 보낸다', () => {
    expect(getKakaoAdditionalInfoGuard()()).toBe('/login')
  })

  it('sessionStorage에서 registrationToken을 복구하면 접근을 허용한다', () => {
    sessionStorage.setItem(
      'kakaoRegistrationToken',
      'restored-registration-token',
    )
    setActivePinia(createPinia())

    expect(getKakaoAdditionalInfoGuard()()).toBeUndefined()
  })
})

describe('Global 인증 Router Guard', () => {
  it('미인증 사용자가 보호 라우트에 접근하면 원래 경로를 보존해 로그인으로 이동한다', async () => {
    const authStore = useAuthStore()

    await navigateTo(PROTECTED_PATH)

    expect(authStore.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe(PROTECTED_PATH)
  })

  it.each(['undefined', 'null', '   '])(
    'persisted accessToken %j은 인증 상태로 승격하지 않고 보호 라우트 접근을 차단한다',
    async (accessToken) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', 'persisted-refresh-token')
      const authStore = useAuthStore()

      await navigateTo(PROTECTED_PATH)

      expect(authStore.isAuthenticated).toBe(false)
      expect(router.currentRoute.value.path).toBe('/login')
      expect(router.currentRoute.value.query.redirect).toBe(PROTECTED_PATH)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    },
  )

  it('유효한 persisted session의 profile 복원에 성공하면 보호 라우트에 진입한다', async () => {
    const { authStore, memberStore } = restorePersistedSession()
    const profile = { id: 1, provider: 'LOCAL' }
    const fetchProfile = vi
      .spyOn(memberStore, 'fetchProfile')
      .mockImplementation(async () => {
        memberStore.profile = profile
        return profile
      })
    const clearSession = vi.spyOn(authStore, 'clearSession')

    await navigateTo(PROTECTED_PATH)

    expect(authStore.isAuthenticated).toBe(true)
    expect(fetchProfile).toHaveBeenCalledOnce()
    expect(memberStore.profile).toEqual(profile)
    expect(clearSession).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe(PROTECTED_PATH)
  })

  it.each(['/login', '/signup'])(
    '인증 사용자가 %s에 접근하면 홈으로 이동한다',
    async (publicPath) => {
      const { memberStore } = restorePersistedSession()
      memberStore.profile = { id: 1, provider: 'LOCAL' }

      await navigateTo(publicPath)

      expect(router.currentRoute.value.path).toBe('/home')
    },
  )

  it.each([
    ['terminal 401', { response: { status: 401 } }],
    ['일반 오류', new Error('profile failed')],
  ])(
    'profile fetch가 %s로 최종 실패하면 session을 정리하고 로그인으로 이동한다',
    async (_failureType, error) => {
      const { authStore, memberStore } = restorePersistedSession()
      vi.spyOn(memberStore, 'fetchProfile').mockRejectedValueOnce(error)
      const clearSession = vi.spyOn(authStore, 'clearSession')

      await navigateTo(PROTECTED_PATH)

      expect(clearSession).toHaveBeenCalledOnce()
      expect(authStore.isAuthenticated).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
      expect(router.currentRoute.value.path).toBe('/login')
      expect(router.currentRoute.value.query.redirect).toBe(PROTECTED_PATH)
    },
  )

  it('session을 정리한 직후 보호 라우트에 접근하면 로그인으로 이동한다', async () => {
    const { authStore, memberStore } = restorePersistedSession()
    memberStore.profile = { id: 1, provider: 'LOCAL' }

    authStore.clearSession()
    await navigateTo(PROTECTED_PATH)

    expect(authStore.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe(PROTECTED_PATH)
  })

  it('일반 사용자가 관리자 문의 화면에 접근하면 설정 화면으로 이동한다', async () => {
    localStorage.setItem('accessToken', createAccessToken('USER'))
    localStorage.setItem('refreshToken', 'persisted-refresh-token')
    const memberStore = useMemberStore()
    memberStore.profile = { id: 1, provider: 'LOCAL' }

    await navigateTo('/admin/inquiries')

    expect(router.currentRoute.value.path).toBe('/settings')
  })

  it('관리자는 관리자 문의 화면에 접근할 수 있다', async () => {
    localStorage.setItem('accessToken', createAccessToken('ADMIN'))
    localStorage.setItem('refreshToken', 'persisted-refresh-token')
    const memberStore = useMemberStore()
    memberStore.profile = { id: 1, provider: 'LOCAL' }

    await navigateTo('/admin/inquiries')

    expect(router.currentRoute.value.path).toBe('/admin/inquiries')
  })
})
