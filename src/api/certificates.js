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

  // 동물등록증 조회 — 동물등록번호 + 신청인(보호자) 이름/생년월일로 국가동물보호정보시스템(APMS)에서
  // 조회. 인증키(serviceKey)는 비공개 값이라 백엔드가 붙여서 대신 호출하고, 프론트는 결과 후보
  // 목록만 받는다.
  // 응답: { result: [{ petId, regNumber, name, breed, gender, neutered, birthDate,
  //   rfidCd, rfidGubun, orgNm, officeTel, aprGbnNm, regTm, aprTm }] }
  syncRegistration({ regNumber, userName, birthDate }) {
    return api.post('/certificates/registration/sync', { regNumber, userName, birthDate })
  },

  // 동물등록증 연동 확정 — 매칭 화면에서 사용자가 선택한 후보(candidate)들을 저장.
  // candidates 배열의 각 항목은 syncRegistration이 돌려준 candidate 그대로(petId 포함)
  saveRegistrationLinks(candidates) {
    return api.post('/certificates/registration/confirm', { candidates })
  },

  // 동물등록증 재동기화 — 이미 연동된 등록증을 재인증 없이 다시 조회
  resyncRegistration(petId, docId) {
    return api.post(`/pets/${petId}/documents/${docId}/resync`)
  },
}
