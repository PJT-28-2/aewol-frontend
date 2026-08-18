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

  // 마이페이지: 로그인 유저(member_id)가 참여한 공동구매 목록 (status 필터: 전체/진행중/달성/마감(미달))
  getMyList(params) {
    return api.get('/group-purchase/my', { params })
  },

  // 참여 신청과 결제가 한 번에 처리됨. quantity는 쿼리 파라미터로 전달해
  // group_purchase_participant.purchase_quantity 컬럼에 저장함(DB에는 quantity 컬럼 없음, 쿼리 파라미터명만 quantity).
  // 본문(recipientName/recipientPhone/zipCode/address/addressDetail)은 GroupPurchaseJoinRequest로
  // 받아 같은 테이블에 저장함(2026-08-18 백엔드 확인)
  join(id, quantity, data) {
    return api.post(`/group-purchase/${id}/join`, data, { params: { quantity } })
  },

  leave(id) {
    return api.post(`/group-purchase/${id}/leave`)
  },

  // 관리자가 공동구매 자체를 취소(판매취소)할 때 사용 — 작성자 본인 여부와 무관하게 관리자면 누구나
  // 호출 가능(2026-08-10 정책 확정). 참여자 전원 환불은 백엔드가 처리.
  cancel(id) {
    return api.post(`/group-purchase/${id}/cancel`)
  },
}
