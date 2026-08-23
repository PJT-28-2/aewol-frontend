const HANGUL_BASE = 0xac00
const HANGUL_LAST = 0xd7a3

/**
 * 마지막 글자의 받침 유무를 돌려준다.
 *
 * 한글 음절로 끝나지 않으면(영문·숫자·이모지 등) 판단할 수 없으므로 null이다.
 * 호출부는 이 경우 받침 없는 쪽 조사를 기본값으로 쓴다 — "뽀삐를", "뽀삐와"처럼
 * 개음절 형태가 어떤 이름에 붙어도 덜 어색하기 때문이다.
 */
function hasFinalConsonant(word) {
  const lastCharCode = word.charCodeAt(word.length - 1)
  const isHangulSyllable =
    lastCharCode >= HANGUL_BASE && lastCharCode <= HANGUL_LAST

  if (!isHangulSyllable) return null

  return (lastCharCode - HANGUL_BASE) % 28 !== 0
}

/**
 * 단어 끝에 받침 유무에 따라 "을"/"를" 조사를 붙여 반환한다.
 * 한글 음절이 아닌 문자로 끝나면 "를"을 기본으로 사용한다.
 */
export function withEulReul(word) {
  if (!word) return ''
  return hasFinalConsonant(word) ? `${word}을` : `${word}를`
}

/**
 * 단어 끝에 받침 유무에 따라 "과"/"와" 조사를 붙여 반환한다.
 * 한글 음절이 아닌 문자로 끝나면 "와"를 기본으로 사용한다.
 *
 * 받침이 있으면 "과"라는 점이 을/를·이/가와 반대라 헷갈리기 쉽다.
 * (황칠복 → 황칠복과, 뽀삐 → 뽀삐와)
 */
export function withWaGwa(word) {
  if (!word) return ''
  return hasFinalConsonant(word) ? `${word}과` : `${word}와`
}
