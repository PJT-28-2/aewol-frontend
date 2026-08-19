import api from './index'

/**
 * 홈 AI 인사이트 카드 조회
 * GET /api/home/insights?petId={petId}
 *
 * result: [{ type, headline, body, ctaLabel, ctaPath, fallback, generatedAt }]
 *
 * - type      SUPPORT | SPENDING | CARE | DONATION. 회원당 종류별 1건이다.
 * - fallback  true면 LLM 생성이 아니라 서버가 데이터로 조립한 문구다. 화면에서
 *             'AI 요약' 표기를 떼는 데 쓴다(생성이 아닌데 그렇게 적으면 거짓말이다).
 * - ctaPath   이동 경로를 서버가 준다. 프론트가 type별로 하드코딩하지 않는다.
 *
 * 서버가 회원·카드별로 캐시하고 배치가 새벽에 미리 채운다. 보여줄 데이터가 없는
 * 카드는 응답에서 빠지므로 프론트는 내려온 것만 그리면 된다.
 */
export function getHomeInsights(petId) {
  // petId는 문자열이라 0이 falsy로 걸릴 일은 없지만, 빈 문자열을 쿼리에 실어
  // 보내지 않도록 명시적으로 거른다.
  const hasPetId = petId != null && petId !== ''
  return api.get('/home/insights', { params: hasPetId ? { petId } : {} })
}
