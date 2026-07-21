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

  uploadDocument(id, formData) {
    return api.post(`/pets/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getDocuments(id) {
    return api.get(`/pets/${id}/documents`)
  },
}
