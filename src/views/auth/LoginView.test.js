import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  startKakaoOAuth: vi.fn(),
  routerPush: vi.fn(),
  authStore: { login: vi.fn() },
  petStore: { fetchPets: vi.fn() },
}))

vi.mock('@/utils/kakaoOAuth', () => ({
  startKakaoOAuth: mocks.startKakaoOAuth,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => mocks.petStore,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.routerPush }),
}))

import LoginView from './LoginView.vue'

let app
let host

const getKakaoButton = () =>
  [...host.querySelectorAll('button')].find((button) =>
    button.textContent.includes('카카오로'),
  )

describe('LoginView Kakao OAuth 진입', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.startKakaoOAuth.mockReturnValue(true)
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(LoginView)
    app.component('RouterLink', {
      template: '<a><slot /></a>',
    })
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  it('Kakao 버튼에서 prompt 없이 기존 빠른 로그인을 시작한다', async () => {
    getKakaoButton().click()
    await nextTick()

    expect(mocks.startKakaoOAuth).toHaveBeenCalledOnce()
    expect(mocks.startKakaoOAuth).toHaveBeenCalledWith()
  })

  it('OAuth 설정이 없으면 기존 오류 안내를 표시한다', async () => {
    mocks.startKakaoOAuth.mockReturnValue(false)

    getKakaoButton().click()
    await nextTick()

    expect(host.textContent).toContain('카카오 로그인 설정을 확인해 주세요.')
  })
})
