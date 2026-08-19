const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState'
const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'

const createOAuthState = () => {
  const randomBytes = new Uint8Array(32)
  window.crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

/**
 * 카카오 OAuth 인증 화면으로 이동한다.
 * 요청마다 생성한 state는 현재 탭의 sessionStorage에 보관한다.
 *
 * @param {{ prompt?: string }} [options]
 * @returns {boolean} OAuth 이동을 시작했는지 여부
 */
export const startKakaoOAuth = ({ prompt } = {}) => {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/callback/kakao`

  if (!clientId) return false

  const state = createOAuthState()
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })

  if (prompt) params.set('prompt', prompt)

  window.location.assign(`${KAKAO_AUTHORIZE_URL}?${params}`)
  return true
}
