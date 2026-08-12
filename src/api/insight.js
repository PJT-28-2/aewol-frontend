import api from './index'

/**
 * 홈 AI 인사이트 카드 조회
 * GET /api/home/insights?petId={petId}
 * result: [{ type, headline, body, ctaLabel, ctaPath, fallback, generatedAt }]
 *
 * 서버가 회원·카드별로 캐시하고 배치가 새벽에 미리 채워둔다. 보여줄 데이터가 없는
 * 카드는 응답에서 빠지므로 프론트는 내려온 것만 그리면 된다.
 */
export function getHomeInsights(petId) {
  return api.get('/home/insights', { params: petId ? { petId } : {} })
}
