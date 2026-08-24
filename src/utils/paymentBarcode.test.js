import { describe, expect, it } from 'vitest'
import {
  BARCODE_REFRESH_MS,
  barcodeStripes,
  buildPaymentToken,
  formatPaymentToken,
  qrModules,
  remainingRefreshSeconds,
} from './paymentBarcode'

describe('buildPaymentToken', () => {
  it('같은 시드와 시간창이면 같은 12자리 숫자를 만든다', () => {
    const at = BARCODE_REFRESH_MS * 10
    expect(buildPaymentToken('member-1', at)).toBe(buildPaymentToken('member-1', at + 1))
    expect(buildPaymentToken('member-1', at)).toMatch(/^\d{12}$/)
  })

  it('시간창이 바뀌면 번호가 달라진다', () => {
    const at = BARCODE_REFRESH_MS * 10
    expect(buildPaymentToken('member-1', at)).not.toBe(
      buildPaymentToken('member-1', at + BARCODE_REFRESH_MS),
    )
  })
})

describe('formatPaymentToken', () => {
  it('4자리씩 띄어 읽기 쉽게 만든다', () => {
    expect(formatPaymentToken('123456789012')).toBe('1234 5678 9012')
  })
})

describe('remainingRefreshSeconds', () => {
  it('창이 끝나기 직전이면 1초를 돌려준다', () => {
    expect(remainingRefreshSeconds(BARCODE_REFRESH_MS - 1)).toBe(1)
  })
})

describe('barcodeStripes / qrModules', () => {
  it('바코드 막대와 QR 격자를 만든다', () => {
    const token = '123456789012'
    const stripes = barcodeStripes(token)
    expect(stripes.length).toBeGreaterThan(40)
    expect(stripes.some(Boolean)).toBe(true)

    const modules = qrModules(token)
    expect(modules).toHaveLength(21)
    expect(modules[0][0]).toBe(true)
    expect(modules[0][20]).toBe(true)
  })
})
