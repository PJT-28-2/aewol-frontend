import api from './index'

export const dashboardApi = {
  // 홈 대시보드 조회 — 잔액 요약 + 이번달지출 + 반려동물별 요약/차트를 화면 진입 1회 호출로 반환
  getHome() {
    return api.get('/wallet/home')
  },

  // 이번달지출 집계 조회
  // params: { groupBy: 'CATEGORY' | 'PET' (필수), yearMonth?: 'yyyy-MM' }
  getMonthly(params) {
    return api.get('/dashboard/monthly', { params })
  },
}
