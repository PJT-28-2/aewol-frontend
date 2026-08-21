import { describe, expect, it } from 'vitest'
import { isValidToken } from './token'

describe('isValidToken', () => {
  it.each([null, undefined, '', '   ', 'undefined', 'null', ' Undefined ', ' NULL '])(
    '%j은 유효하지 않은 토큰으로 판단한다',
    (token) => {
      expect(isValidToken(token)).toBe(false)
    },
  )

  it('실제 문자열 토큰은 유효한 토큰으로 판단한다', () => {
    expect(isValidToken('valid-token')).toBe(true)
  })
})
