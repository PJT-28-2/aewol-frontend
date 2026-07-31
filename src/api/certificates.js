import api from './index'

// pet_document는 petId 하위 리소스라, 목록/상세/업로드/삭제 전부 /api/pets/{petId}/documents 아래로 통일
export const certificatesApi = {
  getList(petId) {
    return api.get(`/api/pets/${petId}/documents`)
  },

  getDetail(petId, docId) {
    return api.get(`/api/pets/${petId}/documents/${docId}`)
  },

  // 접종증명서·진료확인서 공용 업로드. 문서 종류는 multipart 필드
  // docType('VACCINATION' | 'MEDICAL_CONFIRMATION')으로 구분
  uploadDocument(petId, formData) {
    return api.post(`/api/pets/${petId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 동물등록증 해제 · 접종증명서/진료확인서 삭제 공용 — 전부 같은 pet_document 삭제
  deleteDocument(petId, docId) {
    return api.delete(`/api/pets/${petId}/documents/${docId}`)
  },

  // 동물등록증 연동(APMS/CODEF 간편인증) — 백엔드에 아직 확정된 스펙이 없어 경로/바디는 추정치.
  // 실제로는 CODEF 간편인증 1차 요청(organization/loginType=5/loginTypeLevel/userName/
  // birthDate/phoneNo) → continue2Way 확인 → 2차(추가인증) 요청까지 여러 번 오갈 것으로 보임.
  // 현재 스토어(certificate.js)에서도 이 함수는 호출하지 않고 주석으로만 참조함.
  syncRegistration({ userName, birthDate, phoneNo }) {
    return api.post('/api/certificates/registration/sync', { userName, birthDate, phoneNo })
  },

  // 동물등록증 재동기화 — connectedId로 재인증 없이 재조회한다는 전제(경로/바디 추정치, 아직 미확정)
  resyncRegistration(docId) {
    return api.post(`/api/certificates/${docId}/resync`)
  },
}
