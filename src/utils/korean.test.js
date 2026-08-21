import { describe, expect, it } from 'vitest'
import { withEulReul, withWaGwa } from './korean'

describe('withEulReul', () => {
  it('받침이 있으면 "을"을 붙인다', () => {
    expect(withEulReul('황칠복')).toBe('황칠복을')
    expect(withEulReul('콩')).toBe('콩을')
  })

  it('받침이 없으면 "를"을 붙인다', () => {
    expect(withEulReul('뽀삐')).toBe('뽀삐를')
    expect(withEulReul('나비')).toBe('나비를')
  })
})

describe('withWaGwa', () => {
  // 받침이 있을 때 "과"인 점이 을/를과 반대라 실수가 나기 쉬운 자리다.
  it('받침이 있으면 "과"를 붙인다', () => {
    expect(withWaGwa('황칠복')).toBe('황칠복과')
    expect(withWaGwa('콩')).toBe('콩과')
  })

  it('받침이 없으면 "와"를 붙인다', () => {
    expect(withWaGwa('뽀삐')).toBe('뽀삐와')
    expect(withWaGwa('나비')).toBe('나비와')
  })
})

describe('한글이 아닌 이름', () => {
  it('받침 없는 쪽 조사를 기본으로 쓴다', () => {
    expect(withEulReul('Bori')).toBe('Bori를')
    expect(withWaGwa('Bori')).toBe('Bori와')
    expect(withEulReul('9')).toBe('9를')
    expect(withWaGwa('9')).toBe('9와')
  })

  it('빈 값이면 빈 문자열을 돌려준다', () => {
    expect(withEulReul('')).toBe('')
    expect(withWaGwa('')).toBe('')
    expect(withEulReul(undefined)).toBe('')
    expect(withWaGwa(null)).toBe('')
  })
})
