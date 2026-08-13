import { describe, expect, it } from 'vitest'
import { isValidPassword } from './password'

describe('isValidPassword', () => {
  it.each([null, undefined, ''])('문자열 비밀번호가 아니거나 비어 있으면 거절한다: %s', (value) => {
    expect(isValidPassword(value)).toBe(false)
  })

  it.each([
    'Abcdef1!',
    'abcdefgh12',
    'abcdefgh!!',
    'abc123!!',
  ])('허용 문자와 조합·길이 정책을 충족하면 허용한다: %s', (value) => {
    expect(isValidPassword(value)).toBe(true)
  })

  it.each([
    'abcdefgh',
    '1234567890',
    '!!!!!!!!!!',
  ])('문자 종류가 한 종류뿐이면 거절한다: %s', (value) => {
    expect(isValidPassword(value)).toBe(false)
  })

  it.each([
    'abc123한글가나',
    'abc123🙂🙂',
    'abc123 ',
    'Abcd123!한',
  ])('허용 범위 밖 문자가 포함되면 거절한다: %s', (value) => {
    expect(isValidPassword(value)).toBe(false)
  })

  it.each([
    ['3종 7자', 'Abcd1!x', false],
    ['3종 8자', 'Abcdef1!', true],
    ['3종 20자', `A${'a'.repeat(17)}1!`, true],
    ['3종 21자', `A${'a'.repeat(18)}1!`, false],
    ['2종 9자', 'abcdefg12', false],
    ['2종 10자', 'abcdefgh12', true],
    ['2종 20자', `${'a'.repeat(18)}12`, true],
    ['2종 21자', `${'a'.repeat(19)}12`, false],
  ])('%s 길이 경계를 적용한다', (_caseName, value, expected) => {
    expect(isValidPassword(value)).toBe(expected)
  })
})
