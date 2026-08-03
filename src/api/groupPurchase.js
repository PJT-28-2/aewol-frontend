import api from './index'

export const groupPurchaseApi = {
  getList(params) {
    return api.get('/group-purchase', { params })
  },

  // create()가 요구하는 image는 파일이 아니라 URL 문자열(VARCHAR(500))이라, 사진은 먼저 이 엔드포인트로
  // 업로드해서 URL을 받아온 뒤 그 문자열을 create()의 JSON 바디에 실어 보낸다
  uploadImage(formData) {
    return api.post('/group-purchase/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 백엔드가 POST /api/group-purchase에서 @RequestBody Map<String, Object>로 받음 (JSON)
  create(data) {
    return api.post('/group-purchase', data)
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
