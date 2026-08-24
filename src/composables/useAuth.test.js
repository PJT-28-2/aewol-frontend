import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  clearProfile: vi.fn(),
  setHasSimplePassword: vi.fn(),
  resetUserSessionStores: vi.fn(),
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

vi.mock('@/stores/sessionStoreReset', () => ({
  resetUserSessionStores: mocks.resetUserSessionStores,
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}))

import { useAuthStore } from '@/stores/auth'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('토큰이 없으면 checkAuth가 false를 반환한다', async () => {
    const { checkAuth } = useAuth()

    await expect(checkAuth()).resolves.toBe(false)
    expect(mocks.fetchProfile).not.toHaveBeenCalled()
  })

  it('토큰이 있으면 프로필을 조회하고 true를 반환한다', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'dummy-access-token'
    mocks.fetchProfile.mockResolvedValue({ id: 1, provider: 'LOCAL' })
    const { checkAuth, user } = useAuth()

    await expect(checkAuth()).resolves.toBe(true)
    expect(user.value).toEqual({ id: 1, provider: 'LOCAL' })
    expect(mocks.fetchProfile).toHaveBeenCalledOnce()
  })

  it('프로필 조회가 실패하면 세션을 지우고 false를 반환한다', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'dummy-access-token'
    // clearSession이 지우는 대상이 실제로 있는 상태를 만든다.
    localStorage.setItem('accessToken', 'dummy-access-token')
    localStorage.setItem('refreshToken', 'dummy-refresh-token')
    mocks.fetchProfile.mockRejectedValue(new Error('unauthorized'))
    const { checkAuth } = useAuth()

    await expect(checkAuth()).resolves.toBe(false)

    // 여기서 볼 것은 "세션이 끊겼는가"까지다. clearSession이 안에서 무엇을 더 지우는지는
    // stores/auth.test.js가 본다. 양쪽에서 같은 걸 검증하면 구현을 바꿀 때 둘 다 깨진다.
    expect(authStore.accessToken).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})
