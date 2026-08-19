/**
 * QR 결제 페이로드 규약과 파싱 유틸.
 *
 * 규약(A안): `aewol://pay?merchant=<URL 인코딩된 가맹점명>&amount=<정수 원화>`
 *
 * 가맹점명과 금액을 QR에 직접 담는다. 결제요청 ID만 담고 서버에서 조회하는 방식(B안)에 비해
 * 백엔드 변경이 전혀 없다는 장점이 있지만, 사용자가 QR을 위조해 금액을 조작할 수 있다.
 * 시연 범위에서는 이 위험을 감수하고 A안을 쓴다. 실서비스로 가려면 서버가 발급한 결제요청을
 * 조회하는 B안(`payment_request` 테이블 + 생성/조회 API)으로 바꿔야 한다.
 */

const QR_SCHEME = 'aewol://pay?'

/** 가맹점명 최대 길이. 백엔드 `transaction.merchant_name`이 VARCHAR(100)이다. */
const MAX_MERCHANT_NAME_LENGTH = 100

/** 결제 금액 상한. 오인식된 QR로 비정상 금액이 결제되는 것을 막기 위한 방어값이다. */
const MAX_AMOUNT = 10_000_000

/** 파싱 실패 사유별 사용자 안내 문구. */
export const QR_ERROR_MESSAGES = {
  NOT_AEWOL: '애월 결제 QR이 아니에요. 매장의 애월 QR을 스캔해주세요.',
  MISSING_FIELD: 'QR에 가맹점 정보나 금액이 없어요. 매장에 문의해주세요.',
  INVALID_MERCHANT: 'QR의 가맹점 정보를 읽을 수 없어요. 매장에 문의해주세요.',
  INVALID_AMOUNT: 'QR의 결제 금액을 읽을 수 없어요. 매장에 문의해주세요.',
}

/**
 * 스캔한 QR 문자열을 결제 정보로 파싱한다.
 *
 * 실패를 예외 대신 반환값으로 표현한다. 카메라 스캔 루프는 인식할 때마다 이 함수를 호출하므로,
 * 다른 앱의 QR이 잠깐 잡히는 정도로 예외가 던져지면 호출부가 지저분해진다.
 *
 * @param {string | null | undefined} text QR에서 디코딩된 원본 문자열
 * @returns {{ ok: true, merchantName: string, amount: number }
 *   | { ok: false, code: keyof typeof QR_ERROR_MESSAGES, message: string }}
 */
export function parseQrPayment(text) {
  const raw = typeof text === 'string' ? text.trim() : ''
  if (!raw.toLowerCase().startsWith(QR_SCHEME)) {
    return fail('NOT_AEWOL')
  }

  const params = new URLSearchParams(raw.slice(QR_SCHEME.length))
  const merchantParam = params.get('merchant')
  const amountParam = params.get('amount')
  if (merchantParam === null || amountParam === null) {
    return fail('MISSING_FIELD')
  }

  const merchantName = merchantParam.trim()
  if (!merchantName || merchantName.length > MAX_MERCHANT_NAME_LENGTH) {
    return fail('INVALID_MERCHANT')
  }

  // 소수점·부호·지수 표기를 모두 거른다. Number()만 쓰면 "1e3"이나 " 3000 "도 통과한다.
  const amountText = amountParam.trim()
  if (!/^\d+$/.test(amountText)) {
    return fail('INVALID_AMOUNT')
  }

  const amount = Number(amountText)
  if (amount <= 0 || amount > MAX_AMOUNT) {
    return fail('INVALID_AMOUNT')
  }

  return { ok: true, merchantName, amount }
}

/**
 * 결제 정보를 QR 규약 문자열로 만든다. 시연용 QR 이미지를 생성할 때 사용한다.
 *
 * @param {{ merchantName: string, amount: number }} payment 가맹점명과 결제 금액
 * @returns {string} `aewol://pay?merchant=...&amount=...` 형식의 문자열
 */
export function buildQrPayment({ merchantName, amount }) {
  const params = new URLSearchParams({ merchant: merchantName, amount: String(amount) })
  return `${QR_SCHEME}${params.toString()}`
}

function fail(code) {
  return { ok: false, code, message: QR_ERROR_MESSAGES[code] }
}
