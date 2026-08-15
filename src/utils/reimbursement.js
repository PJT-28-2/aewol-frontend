/**
 * 손익분기 시뮬레이터의 환급률 표시 판정.
 *
 * 화면에서 분리한 이유는 두 가지다.
 * 1) 이 규칙은 "무엇을 단언해도 되는가"에 대한 판단이라 회귀가 생기면 곧바로
 *    거짓 표시가 된다. 템플릿 안에만 두면 검증할 방법이 없다.
 * 2) 전부 순수 함수라 컴포넌트를 마운트하지 않고 그대로 단위 테스트할 수 있다.
 *
 * 색·클래스 매핑은 여기에 두지 않는다. Tailwind 클래스 문자열은 화면의 관심사이고,
 * 이 모듈은 "어떤 상태인가"까지만 답한다.
 */

/**
 * 약관에서 환급률을 확인하지 못해 금융감독원 규제 상한(자기부담률 30% 이상
 * → 환급률 70% 이하)으로 채운 값. 확인값이 아니라 "아무리 유리해도 이 이상은
 * 아니다"라는 상한이다 (백엔드 V34).
 */
export const REGULATORY_BOUND = 'REGULATORY_BOUND'

const CONFIRMED_OWN_COVERAGE_NAME = 'CONFIRMED_OWN_COVERAGE_NAME'

/**
 * 환급률 확인 배지의 상태값. 표시 문구·색과 분리해, 문구를 바꾸거나 다국어를
 * 붙여도 스타일 매핑이 깨지지 않게 한다.
 *
 * rate가 null이면 confidence와 무관하게 UNKNOWN으로 고정한다 — 한 카드에
 * "배지=추정 + 본문=미확인"이 동시에 뜨는 상황을 막는다.
 *
 * @param {object} product 추천 상품 응답
 * @returns {'CONFIRMED'|'ESTIMATED'|'REGULATORY_BOUND'|'UNKNOWN'}
 */
export function reimbursementStatus(product) {
  if (product.reimbursementRatePct == null) return 'UNKNOWN'
  if (isRegulatoryBound(product)) return REGULATORY_BOUND
  return product.reimbursementConfidence === CONFIRMED_OWN_COVERAGE_NAME
    ? 'CONFIRMED'
    : 'ESTIMATED'
}

/**
 * 규제 상한으로 채운 상품인지. 이 값을 화면에서 확정 환급률처럼 단언하면
 * 거짓 표시가 된다.
 *
 * @param {object} product 추천 상품 응답
 * @returns {boolean}
 */
export function isRegulatoryBound(product) {
  return product.reimbursementConfidence === REGULATORY_BOUND
}

/**
 * 환급률 표시 문구. 규제 상한 상품은 반드시 "최대"를 붙여 상한임을 드러낸다.
 *
 * @param {object} product 추천 상품 응답
 * @returns {string}
 */
export function reimbursementRateText(product) {
  if (product.reimbursementRatePct == null) return '보장비율 미확인'
  if (isRegulatoryBound(product)) return `최대 환급률 ${product.reimbursementRatePct}%`
  return `환급률 ${product.reimbursementRatePct}%`
}

/**
 * 손익분기 한 줄의 판정 문구와 색 톤.
 *
 * 상한 기준으로 "불리"면 실제로는 더 불리하므로 그대로 단정할 수 있다(참인 진술).
 * 반대로 상한 기준으로 "유리"한 것은 최선의 경우일 뿐이라 단정할 수 없다 —
 * 문구에 "상한 기준"을 붙이고 유리색도 쓰지 않는다.
 *
 * 문구와 톤을 한 함수가 함께 돌려주는 이유는, 둘을 따로 두면 한쪽만 고쳤을 때
 * "불리라고 써놓고 유리색"처럼 조용히 어긋나기 때문이다.
 *
 * @param {object} product 추천 상품 응답
 * @param {object} scenario 손익분기 시나리오 한 행
 * @returns {{ label: string, tone: 'FAVORABLE'|'UNFAVORABLE'|'BOUND' }}
 */
export function breakEvenVerdict(product, scenario) {
  if (!scenario.isFavorable) {
    return { label: '불리', tone: 'UNFAVORABLE' }
  }
  return isRegulatoryBound(product)
    ? { label: '상한 기준 유리', tone: 'BOUND' }
    : { label: '유리', tone: 'FAVORABLE' }
}

/**
 * 손익분기 표의 판정 열 머리글. 규제 상한 상품의 표는 전부 최선의 경우다.
 *
 * @param {object} product 추천 상품 응답
 * @returns {string}
 */
export function breakEvenVerdictHeader(product) {
  return isRegulatoryBound(product) ? '최선의 경우' : '유불리'
}
