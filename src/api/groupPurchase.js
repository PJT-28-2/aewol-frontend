import api from './index'

export const groupPurchaseApi = {
  getList(params) {
    return api.get('/group-purchase', { params })
  },

  create(data) {
    return api.post('/group-purchase/create', data)
  },

  getDetail(id) {
    return api.get(`/group-purchase/${id}`)
  },

  getStatus(id) {
    return api.get(`/group-purchase/${id}/status`)
  },

  // 마이페이지: 로그인 유저(member_id)가 참여한 공동구매 목록 (status 필터: 전체/진행중/마감(성공)/마감(미달))
  getMyList(params) {
    return api.get('/group-purchase/my', { params })
  },

  join(id) {
    return api.post(`/group-purchase/${id}/join`)
  },

  leave(id) {
    return api.post(`/group-purchase/${id}/leave`)
  },
}
