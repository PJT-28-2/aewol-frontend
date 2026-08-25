import { describe, expect, it } from 'vitest'
import { isSafeGovernmentApplyUrl } from './governmentApplyUrl'

describe('isSafeGovernmentApplyUrl', () => {
  it.each([
    'https://www.gov.kr/portal/rcvfvrSvc/dtlEx/305000000132',
    'https://gov.kr/portal',
    'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do',
    'https://www.mois.go.kr/frt/a01/frtMain.do',
  ])('정부 https 주소는 허용한다: %s', (url) => {
    expect(isSafeGovernmentApplyUrl(url)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://www.gov.kr/portal',
    'https://evil.com',
    'https://gov.kr.evil.com',
    'https://www.gov.kr.attacker.com/phish',
    '//www.gov.kr/portal',
    '/portal',
    'https://127.0.0.1/',
    'https://user:pass@www.gov.kr/',
    '',
    null,
  ])('정부 도메인이 아니면 거절한다: %s', (url) => {
    expect(isSafeGovernmentApplyUrl(url)).toBe(false)
  })
})
