const ALLOWED_HOSTS = new Set(['gov.kr', 'go.kr'])
const ALLOWED_HOST_SUFFIXES = ['.gov.kr', '.go.kr']

/**
 * 정부지원사업 신청 주소가 https 정부 도메인인지 확인한다.
 * 서버 데이터가 오염돼 javascript: 이나 외부 호스트가 들어와도 열지 않기 위함이다.
 *
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeGovernmentApplyUrl(url) {
  if (typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!/^https:\/\//i.test(trimmed)) return false

  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false
  if (parsed.username || parsed.password) return false

  const host = parsed.hostname.toLowerCase()
  if (!host || host.startsWith('[') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return false
  }
  if (ALLOWED_HOSTS.has(host)) return true
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) && host.length > suffix.length,
  )
}
