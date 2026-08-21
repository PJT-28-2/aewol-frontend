import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  kakaoLogin: vi.fn(),
  fetchPets: vi.fn(),
  routerReplace: vi.fn(),
  query: { code: 'oauth-code', state: 'oauth-state' },
}))

vi.mock('@/stores/auth', () => ({
  KAKAO_ACCOUNT_RESTORED: 'ACCOUNT_RESTORED',
  KAKAO_ADDITIONAL_INFO_REQUIRED: 'ADDITIONAL_INFO_REQUIRED',
  KAKAO_LOGIN_COMPLETE: 'LOGIN_COMPLETE',
  useAuthStore: () => ({ kakaoLogin: mocks.kakaoLogin }),
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({ fetchPets: mocks.fetchPets }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({ replace: mocks.routerReplace }),
}))

import KakaoCallbackView from './KakaoCallbackView.vue'

let app
let host

const flushUpdates = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('KakaoCallbackView OAuth result routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    sessionStorage.setItem('kakaoOAuthState', 'oauth-state')
    mocks.fetchPets.mockResolvedValue([{ id: 1 }])
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(KakaoCallbackView)
    app.component('RouterLink', { template: '<a><slot /></a>' })
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  const mountView = async () => {
    app.mount(host)
    await flushUpdates()
  }

  it('LOGIN_COMPLETE는 기존 후속 경로로 한 번 이동한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({ authStatus: 'LOGIN_COMPLETE' })

    await mountView()

    expect(mocks.fetchPets).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledWith('/home')
  })

  it('ADDITIONAL_INFO_REQUIRED는 기존 추가정보 입력 경로로 이동한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({ authStatus: 'ADDITIONAL_INFO_REQUIRED' })

    await mountView()

    expect(mocks.routerReplace).toHaveBeenCalledWith('/signup/kakao/additional-info')
    expect(mocks.fetchPets).not.toHaveBeenCalled()
  })

  it('ACCOUNT_RESTORED는 안내 확인 후 기존 로그인 완료 경로로 한 번 이동한다', async () => {
    mocks.kakaoLogin.mockResolvedValue({ authStatus: 'ACCOUNT_RESTORED' })

    await mountView()

    expect(document.body.textContent).toContain('탈퇴했던 계정이 복구되었습니다.')
    expect(mocks.fetchPets).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).not.toHaveBeenCalled()

    const confirmButton = [...document.body.querySelectorAll('button')]
      .find((button) => button.textContent.trim() === '확인')
    confirmButton.click()
    await flushUpdates()

    expect(mocks.routerReplace).toHaveBeenCalledOnce()
    expect(mocks.routerReplace).toHaveBeenCalledWith('/home')
  })
})
