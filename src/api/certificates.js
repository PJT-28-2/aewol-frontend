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
}
