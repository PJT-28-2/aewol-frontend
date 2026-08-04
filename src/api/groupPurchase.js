import api from './index'

export const groupPurchaseApi = {
  getList(params) {
    return api.get('/group-purchase', { params })
  },

  // create()가 요구하는 image는 파일이 아니라 URL 문자열(VARCHAR(500))이라, 사진은 먼저 이 엔드포인트로
  // 업로드해서 URL을 받아온 뒤 그 문자열을 create()의 JSON 바디에 실어 보낸다
  // (백엔드가 이 업로드 엔드포인트와 group_purchase.image INSERT 매핑을 함께 구현해줘야 실제로 저장됨)
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

  // 참여 신청과 결제가 한 번에 처리됨. 백엔드가 현재 quantity 쿼리 파라미터만 읽어서
  // group_purchase_participant.purchase_quantity 컬럼에 저장함(DB에는 quantity 컬럼 없음, 쿼리 파라미터명만 quantity).
  // 본문(shippingAddress 포함)은 아직 처리하지 않음 — 배송지 저장은 백엔드가 본문을 읽도록 구현되기 전까지는 반영되지 않는다
  join(id, quantity, data) {
    return api.post(`/group-purchase/${id}/join`, data, { params: { quantity } })
  },

  leave(id) {
    return api.post(`/group-purchase/${id}/leave`)
  },

  // 작성자가 공동구매 자체를 취소(판매취소)할 때 사용. 참여자 전원 환불은 백엔드가 처리.
  // TODO: 백엔드에 해당 엔드포인트가 아직 없음 — 실제 경로/응답 형식은 API 명세 확정 후 맞출 것
  cancel(id) {
    return api.post(`/group-purchase/${id}/cancel`)
  },
}
