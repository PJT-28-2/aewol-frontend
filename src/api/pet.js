import api from './index'

export const petApi = {
  getPets() {
    return api.get('/pets')
  },

  getPet(id) {
    return api.get(`/pets/${id}`)
  },

  createPet(data) {
    return api.post('/pets', data)
  },

  updatePet(id, data) {
    return api.put(`/pets/${id}`, data)
  },

  deletePet(id) {
    return api.delete(`/pets/${id}`)
  },

  verifyRegistration(id, data) {
    return api.post(`/pets/${id}/verify`, data)
  },

  uploadDocument(id, file, issuedDate) {
    const formData = new FormData()
    formData.append('file', file)
    if (issuedDate) formData.append('issuedDate', issuedDate)
    return api.post(`/pets/${id}/documents`, formData)
  },

  getDocuments(id) {
    return api.get(`/pets/${id}/documents`)
  },

  deleteDocument(id, docId) {
    return api.delete(`/pets/${id}/documents/${docId}`)
  },
}
