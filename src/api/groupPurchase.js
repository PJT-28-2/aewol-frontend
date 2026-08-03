import api from './index'

export const groupPurchaseApi = {
  getList(params) {
    return api.get('/group-purchase', { params })
  },

  // 상품 이미지 파일을 포함하므로 JSON이 아니라 multipart/form-data로 전송
  create(formData) {
    return api.post('/group-purchase/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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

  // 참여 신청과 결제가 한 번에 처리됨(quantity, shippingAddress 포함)
  join(id, data) {
    return api.post(`/group-purchase/${id}/join`, data)
  },

  leave(id) {
    return api.post(`/group-purchase/${id}/leave`)
  },
}
