/**
 * JWT access token의 payload(claims)를 디코딩한다. 서명 검증은 하지 않으며,
 * role처럼 화면 표시를 결정하는 데 쓰는 클레임을 읽는 용도로만 사용한다 —
 * 실제 접근 권한은 항상 서버가 최종 판단한다(이 값은 UX용 방어일 뿐).
 *
 * @param {string | null | undefined} token JWT access token
 * @returns {Record<string, unknown> | null} 디코딩된 payload, 실패 시 null
 */
export function decodeJwtPayload(token) {
  if (!token) return null
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}
