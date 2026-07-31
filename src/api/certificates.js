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

  // 동물등록증 조회 — 신원 정보로 신청인 명의의 동물을 국가동물보호정보시스템(APMS)에서 조회.
  // 외부 조회 API 연동은 백엔드가 대신 처리하고, 프론트는 결과 후보 목록만 받는다.
  // 응답: { result: [{ petId, regNumber, name, breed, gender, neutered, birthDate, furColor,
  //   ownerName, ownerPhone, issueDate, registerDate, issueOrg, regState, regType }] }
  syncRegistration({ userName, birthDate, phoneNo }) {
    return api.post('/api/certificates/registration/sync', { userName, birthDate, phoneNo })
  },

  // 동물등록증 연동 확정 — 매칭 화면에서 사용자가 선택한 후보(candidate)들을 저장.
  // candidates 배열의 각 항목은 syncRegistration이 돌려준 candidate 그대로(petId 포함)
  saveRegistrationLinks(candidates) {
    return api.post('/api/certificates/registration/confirm', { candidates })
  },

  // 동물등록증 재동기화 — 이미 연동된 등록증을 재인증 없이 다시 조회
  resyncRegistration(petId, docId) {
    return api.post(`/api/pets/${petId}/documents/${docId}/resync`)
  },
}
