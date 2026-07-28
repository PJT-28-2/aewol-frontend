const HANGUL_BASE = 0xac00
const HANGUL_LAST = 0xd7a3

/**
 * 단어 끝에 받침 유무에 따라 "을"/"를" 조사를 붙여 반환한다.
 * 한글 음절이 아닌 문자로 끝나면 "를"을 기본으로 사용한다.
 */
export function withEulReul(word) {
  if (!word) return ''

  const lastCharCode = word.charCodeAt(word.length - 1)
  const isHangulSyllable =
    lastCharCode >= HANGUL_BASE && lastCharCode <= HANGUL_LAST

  if (!isHangulSyllable) return `${word}를`

  const hasFinalConsonant = (lastCharCode - HANGUL_BASE) % 28 !== 0
  return hasFinalConsonant ? `${word}을` : `${word}를`
}
