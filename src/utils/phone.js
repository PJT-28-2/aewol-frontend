/**
 * 숫자만 남긴 뒤 자릿수에 맞춰 하이픈을 채워 넣는다.
 * 010 등 11자리 휴대폰 번호는 3-4-4, 10자리는 3-3-4로 묶는다.
 *
 * @param {string} value 사용자가 입력 중인 전화번호 문자열
 * @returns {string} 하이픈이 포함된 전화번호
 */
export function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length < 4) return digits
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length < 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
