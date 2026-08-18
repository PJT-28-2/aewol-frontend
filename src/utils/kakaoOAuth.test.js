import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startKakaoOAuth } from './kakaoOAuth'

const createWindowStub = () => {
  const setItem = vi.fn()
  const assign = vi.fn()
  const getRandomValues = vi.fn((bytes) => {
    bytes.fill(0xab)
    return bytes
  })

  vi.stubGlobal('window', {
    crypto: { getRandomValues },
    location: {
      origin: 'http://localhost:5173',
      assign,
    },
    sessionStorage: { setItem },
  })

  return { assign, getRandomValues, setItem }
}

describe('startKakaoOAuth', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KAKAO_REST_API_KEY', 'test-client-id')
    vi.stubEnv('VITE_KAKAO_REDIRECT_URI', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('state를 생성해 현재 탭에 저장하고 기본 callback URI로 이동한다', () => {
    const { assign, getRandomValues, setItem } = createWindowStub()

    expect(startKakaoOAuth()).toBe(true)

    const state = 'ab'.repeat(32)
    expect(getRandomValues).toHaveBeenCalledOnce()
    expect(setItem).toHaveBeenCalledWith('kakaoOAuthState', state)
    expect(assign).toHaveBeenCalledOnce()

    const authorizeUrl = new URL(assign.mock.calls[0][0])
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      'https://kauth.kakao.com/oauth/authorize',
    )
    expect(authorizeUrl.searchParams.get('client_id')).toBe('test-client-id')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost:5173/callback/kakao',
    )
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('state')).toBe(state)
    expect(authorizeUrl.searchParams.has('prompt')).toBe(false)
  })

  it('지정한 redirect URI와 prompt만 authorize 요청에 추가한다', () => {
    vi.stubEnv(
      'VITE_KAKAO_REDIRECT_URI',
      'https://app.example.com/callback/kakao',
    )
    const { assign } = createWindowStub()

    expect(startKakaoOAuth({ prompt: 'login' })).toBe(true)

    const authorizeUrl = new URL(assign.mock.calls[0][0])
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      'https://app.example.com/callback/kakao',
    )
    expect(authorizeUrl.searchParams.get('prompt')).toBe('login')
  })

  it('REST API Key가 없으면 state를 만들거나 OAuth 페이지로 이동하지 않는다', () => {
    vi.stubEnv('VITE_KAKAO_REST_API_KEY', '')
    const { assign, getRandomValues, setItem } = createWindowStub()

    expect(startKakaoOAuth({ prompt: 'login' })).toBe(false)
    expect(getRandomValues).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})
