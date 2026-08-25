import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('앱 폰트 토큰', () => {
  it('본문 글꼴로 Pretendard Variable을 쓴다', () => {
    const css = readFileSync(resolve('src/assets/styles/variables.css'), 'utf8')
    expect(css).toMatch(/--font-family:\s*'Pretendard Variable'/)
  })
})
