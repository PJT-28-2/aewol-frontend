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

  // 동물등록증 연동(APMS/CODEF 동기화) — 백엔드에 아직 확정된 스펙이 없어 경로/바디는 추정치.
  // 현재 스토어(certificate.js)에서도 이 함수는 호출하지 않고 주석으로만 참조함.
  syncRegistration(petId, regNumber) {
    return api.post('/api/certificates/registration/sync', { petId, regNumber })
  },
}
