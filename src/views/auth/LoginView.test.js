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

const submitLogin = async () => {
  host.querySelector('form').dispatchEvent(new Event('submit'))
  await Promise.resolve()
  await nextTick()
}

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

  it('401이면 이메일 또는 비밀번호 오류를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue({
      response: { status: 401, data: {} },
    })

    await submitLogin()

    expect(host.textContent).toContain('이메일 또는 비밀번호를 확인해 주세요.')
  })

  it('429이면 서버 메시지를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue({
      response: {
        status: 429,
        data: { message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.' },
      },
    })

    await submitLogin()

    expect(host.textContent).toContain(
      '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
    )
    expect(host.textContent).not.toContain('이메일 또는 비밀번호를 확인해 주세요.')
  })

  it('503이면 사용자용 서버 메시지를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue({
      response: {
        status: 503,
        data: { message: '현재 인증 서비스를 이용할 수 없습니다.' },
      },
    })

    await submitLogin()

    expect(host.textContent).toContain('현재 인증 서비스를 이용할 수 없습니다.')
    expect(host.textContent).not.toContain('이메일 또는 비밀번호를 확인해 주세요.')
  })

  it('503에 사용자용 서버 메시지가 없으면 서비스 장애 안내를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue({
      response: { status: 503, data: {} },
    })

    await submitLogin()

    expect(host.textContent).toContain(
      '현재 서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  })

  it('응답이 없는 네트워크 오류이면 네트워크 안내를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue(new Error('Network Error'))

    await submitLogin()

    expect(host.textContent).toContain('네트워크 연결을 확인해 주세요.')
    expect(host.textContent).not.toContain('이메일 또는 비밀번호를 확인해 주세요.')
  })

  it('기타 5xx이면 일반 서버 오류 안내를 표시한다', async () => {
    mocks.authStore.login.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal NullPointerException at AuthService' },
      },
    })

    await submitLogin()

    expect(host.textContent).toContain(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    )
    expect(host.textContent).not.toContain('Internal NullPointerException')
    expect(host.textContent).not.toContain('이메일 또는 비밀번호를 확인해 주세요.')
  })
})

describe('LoginView theme-color', () => {
  let meta

  beforeEach(() => {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#15191b')
    document.head.appendChild(meta)
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
    meta.remove()
  })

  it('다크모드에서도 브라우저 상단색을 밝은 색으로 덮지 않는다', () => {
    expect(meta.getAttribute('content')).toBe('#15191b')
  })
})
