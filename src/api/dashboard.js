import api from './index'

// 실제 백엔드(aewol-backend DashboardController) 기준: /api/dashboard/summary, /api/dashboard/category
export const dashboardApi = {
  // 월별 지출 요약
  // params: { month?: 'yyyy-MM' (기본값 이번 달) }
  getSummary(params) {
    return api.get('/dashboard/summary', { params })
  },

  // 카테고리별 지출
  // params: { petId?: string }
  getCategory(params) {
    return api.get('/dashboard/category', { params })
  },
}
