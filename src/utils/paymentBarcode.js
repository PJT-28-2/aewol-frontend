/**
 * 포스기용 결제 바코드·QR 시연 유틸.
 *
 * 실제 결제요청을 발급하지 않는다. 카카오페이처럼 보이는 번호·막대·격자만 만들고,
 * 포스가 찍어도 잔액은 줄지 않는다.
 */

export const BARCODE_REFRESH_MS = 30_000

const DIGIT_PATTERNS = [
  '10100110100',
  '10110010010',
  '10010010110',
  '10101100100',
  '10011010100',
  '10001101010',
  '11010010100',
  '11001010100',
  '11010100100',
  '10110100100',
]

function hash32(text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * @param {string} seed 회원별 구분값. 같은 시드·같은 시간창이면 같은 번호가 나온다.
 * @param {number} [at]
 * @returns {string} 숫자 12자리
 */
export function buildPaymentToken(seed, at = Date.now()) {
  const windowIndex = Math.floor(at / BARCODE_REFRESH_MS)
  const hashed = hash32(`${seed || 'guest'}:${windowIndex}`)
  return hashed.toString().padStart(12, '0').slice(-12)
}

export function formatPaymentToken(token) {
  return String(token).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function remainingRefreshSeconds(at = Date.now()) {
  const elapsed = at % BARCODE_REFRESH_MS
  return Math.max(1, Math.ceil((BARCODE_REFRESH_MS - elapsed) / 1000))
}

/** 바코드 막대. true가 검은 막대다. */
export function barcodeStripes(token) {
  const bits = ['11010011100']
  for (const digit of String(token)) {
    bits.push(DIGIT_PATTERNS[Number(digit)] ?? DIGIT_PATTERNS[0])
  }
  bits.push('1100011101011')
  return bits.join('').split('').map((bit) => bit === '1')
}

const QR_SIZE = 21

function paintFinder(modules, row, column) {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
      modules[row + y][column + x] = edge || core
    }
  }
}

/** 시연용 QR 격자. 표준 QR이 아니므로 리더기가 읽지 않아도 된다. */
export function qrModules(token) {
  const modules = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false))
  paintFinder(modules, 0, 0)
  paintFinder(modules, 0, QR_SIZE - 7)
  paintFinder(modules, QR_SIZE - 7, 0)

  const hashed = hash32(String(token))
  for (let row = 0; row < QR_SIZE; row += 1) {
    for (let column = 0; column < QR_SIZE; column += 1) {
      const inFinder =
        (row < 8 && column < 8)
        || (row < 8 && column >= QR_SIZE - 8)
        || (row >= QR_SIZE - 8 && column < 8)
      if (inFinder) continue
      const bit = (hashed >> ((row * QR_SIZE + column) % 31)) & 1
      modules[row][column] = bit === 1
    }
  }
  return modules
}

export const QR_MODULE_COUNT = QR_SIZE
