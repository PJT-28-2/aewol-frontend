const WINDOWS_1252_BYTES = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
])

/**
 * UTF-8 한글이 Windows-1252 문자열로 잘못 저장된 경우에만 원문을 복원한다.
 * 정상 한글과 영문·유럽어 이름은 그대로 반환한다.
 *
 * @param {unknown} value 확인할 값
 * @returns {unknown} 복원된 문자열 또는 원래 값
 */
export function repairKoreanMojibake(value) {
  if (typeof value !== 'string' || /[가-힣]/.test(value)) return value

  const bytes = []
  for (const character of value) {
    const byte = WINDOWS_1252_BYTES.get(character) ?? character.codePointAt(0)
    if (byte > 0xff) return value
    bytes.push(byte)
  }

  try {
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
    return /[가-힣]/.test(repaired) ? repaired : value
  } catch {
    return value
  }
}
