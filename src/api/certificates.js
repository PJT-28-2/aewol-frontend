import api from './index'

// pet_document는 petId 하위 리소스라, 목록/상세/업로드/삭제 전부 /pets/{petId}/documents 아래로 통일
// baseURL(axios 인스턴스)이 이미 /api를 포함하므로 여기서는 /api를 다시 붙이지 않는다
export const certificatesApi = {
  getList(petId) {
    return api.get(`/pets/${petId}/documents`)
  },

  getDetail(petId, docId) {
    return api.get(`/pets/${petId}/documents/${docId}`)
  },

  uploadVaccination(petId, file, issuedDate) {
    const formData = new FormData()
    formData.append('file', file)
    if (issuedDate) formData.append('issuedDate', issuedDate)

    // Content-Type은 직접 지정하지 않아야 브라우저가 multipart boundary를 함께 설정한다.
    return api.post(`/pets/${petId}/documents`, formData)
  },

  // 진료확인서 공용 업로드는 기존 백엔드 규격을 유지한다.
  uploadDocument(petId, formData) {
    return api.post(`/pets/${petId}/documents`, formData)
  },

  // 동물등록증 해제 · 접종증명서/진료확인서 삭제 공용 — 전부 같은 pet_document 삭제
  deleteDocument(petId, docId) {
    return api.delete(`/pets/${petId}/documents/${docId}`)
  },

  // 동물등록증 인증 — 이미 존재하는 반려동물(petId) 하나를 대상으로, 동물등록번호 + 신청인(보호자)
  // 이름/생년월일로 국가동물보호정보시스템(APMS)을 검증하고 성공 시 그 자리에서 바로 저장까지 됨
  // (조회 전용 API 없음 — 호출 = 검증 + 저장). 이후 갱신은 아래 전용 재동기화 API를 사용한다.
  // 인증키(serviceKey)는 비공개 값이라 백엔드가 붙여서 대신 호출한다.
  verifyRegistration(petId, { regNumber, userName, birthDate }) {
    return api.post(`/pets/${petId}/verify`, { regNumber, userName, birthDate })
  },

  resyncRegistration(petId, docId) {
    return api.post(`/pets/${petId}/documents/${docId}/resync`)
  },
}
