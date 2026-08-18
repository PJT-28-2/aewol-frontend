import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  startKakaoOAuth: vi.fn(),
  routerBack: vi.fn(),
  routerPush: vi.fn(),
  authStore: {
    sendSignupCode: vi.fn(),
    signup: vi.fn(),
    verifySignupCode: vi.fn(),
  },
}))

vi.mock('@/utils/kakaoOAuth', () => ({
  startKakaoOAuth: mocks.startKakaoOAuth,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back: mocks.routerBack,
    push: mocks.routerPush,
  }),
}))

import SignupView from './SignupView.vue'

let app
let host

const getKakaoButton = () =>
  [...host.querySelectorAll('button')].find((button) =>
    button.textContent.includes('카카오로'),
  )

describe('SignupView Kakao OAuth 진입', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.startKakaoOAuth.mockReturnValue(true)
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(SignupView)
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  it('Kakao 버튼에서 login 화면을 거치지 않고 prompt=login으로 OAuth를 시작한다', async () => {
    getKakaoButton().click()
    await nextTick()

    expect(mocks.startKakaoOAuth).toHaveBeenCalledWith({ prompt: 'login' })
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })

  it('OAuth 설정이 없으면 회원가입 화면에 오류를 표시한다', async () => {
    mocks.startKakaoOAuth.mockReturnValue(false)

    getKakaoButton().click()
    await nextTick()

    expect(host.textContent).toContain('카카오 로그인 설정을 확인해 주세요.')
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })
})
