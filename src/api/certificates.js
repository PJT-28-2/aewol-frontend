import api from './index'

export const certificatesApi = {
  getList(petId) {
    return api.get('/api/certificates', { params: { petId } })
  },

  getDetail(docId) {
    return api.get(`/api/certificates/${docId}`)
  },

  uploadVaccination(petId, formData) {
    return api.post('/api/certificates/vaccination', formData, {
      params: { petId },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadMedicalConfirmation(petId, formData) {
    return api.post('/api/certificates/medical-confirmation', formData, {
      params: { petId },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 동물등록증 연동(APMS/CODEF 간편인증) — 백엔드에 아직 확정된 스펙이 없어 경로/바디는 추정치.
  // 실제로는 CODEF 간편인증 1차 요청(organization/loginType=5/loginTypeLevel/userName/
  // birthDate/phoneNo) → continue2Way 확인 → 2차(추가인증) 요청까지 여러 번 오갈 것으로 보임.
  // 현재 스토어(certificate.js)에서도 이 함수는 호출하지 않고 주석으로만 참조함.
  syncRegistration({ userName, birthDate, phoneNo }) {
    return api.post('/api/certificates/registration/sync', { userName, birthDate, phoneNo })
  },

  // 동물등록증 재동기화 — connectedId로 재인증 없이 재조회한다는 전제(경로/바디 추정치)
  resyncRegistration(docId) {
    return api.post(`/api/certificates/${docId}/resync`)
  },

  // 동물등록증 연동 해제(경로 추정치)
  deleteRegistration(docId) {
    return api.delete(`/api/certificates/${docId}`)
  },
}
