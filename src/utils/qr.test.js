import { describe, expect, it } from 'vitest'
import {
  QR_ERROR_MESSAGES,
  buildAppPaymentPath,
  buildQrPayment,
  parsePaymentQuery,
  parseQrPayment,
} from './qr'

describe('parseQrPayment', () => {
  it('애월 QR 규약을 가맹점명과 금액으로 읽는다', () => {
    const parsed = parseQrPayment(buildQrPayment({ merchantName: '멍냥마켓', amount: 51800 }))

    expect(parsed).toEqual({ ok: true, merchantName: '멍냥마켓', amount: 51800 })
  })

  it('애월 결제 QR이 아니면 거절한다', () => {
    expect(parseQrPayment('https://example.com').code).toBe('NOT_AEWOL')
  })
})

describe('parsePaymentQuery', () => {
  it('앱 열기 쿼리에서 가맹점명과 금액을 읽는다', () => {
    expect(parsePaymentQuery({ merchant: '멍냥마켓', amount: '51800' })).toEqual({
      ok: true,
      merchantName: '멍냥마켓',
      amount: 51800,
    })
  })

  it('금액이 없으면 거절한다', () => {
    const parsed = parsePaymentQuery({ merchant: '멍냥마켓' })

    expect(parsed.ok).toBe(false)
    expect(parsed.message).toBe(QR_ERROR_MESSAGES.MISSING_FIELD)
  })

  it('0원·소수 금액은 거절한다', () => {
    expect(parsePaymentQuery({ merchant: '멍냥마켓', amount: '0' }).code).toBe('INVALID_AMOUNT')
    expect(parsePaymentQuery({ merchant: '멍냥마켓', amount: '1e3' }).code).toBe('INVALID_AMOUNT')
  })
})

describe('buildAppPaymentPath', () => {
  it('결제 확인 화면 경로에 가맹점명과 금액을 담는다', () => {
    expect(buildAppPaymentPath({ merchantName: '멍냥마켓', amount: 51800 })).toBe(
      '/payment/qr?merchant=%EB%A9%8D%EB%83%A5%EB%A7%88%EC%BC%93&amount=51800',
    )
  })
})
