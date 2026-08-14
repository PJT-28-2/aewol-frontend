/**
 * 비밀번호가 서비스의 허용 문자, 길이, 문자 종류 조합 정책을 충족하는지 확인한다.
 *
 * @param {string} value 검사할 비밀번호
 * @returns {boolean} 비밀번호 정책 충족 여부
 */
export const isValidPassword = (value) => {
  if (typeof value !== 'string') return false
  if (!/^[\x21-\x7E]+$/.test(value)) return false

  const categoryCount = [
    /[A-Za-z]/.test(value),
    /\d/.test(value),
    /[!-/:-@[-`{-~]/.test(value),
  ].filter(Boolean).length

  return (
    value.length <= 20 &&
    ((categoryCount >= 3 && value.length >= 8) ||
      (categoryCount >= 2 && value.length >= 10))
  )
}
