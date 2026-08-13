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

  /**
   * 반려동물 사진으로 AI 캐릭터 이미지 생성
   * POST /api/pets/{petId}/character
   * body: photo (multipart, PNG/JPG/WEBP, 최대 10MB)
   * result: { petId, profileImg, characterImg, remainingToday }
   *
   * 외부 LLM을 전신 캐릭터 → 정면 얼굴 두 단계로 호출해 20초 이상 걸린다.
   * 공용 axios 인스턴스에는 타임아웃이 없지만, 이 호출만은 무한 대기하지 않도록
   * 넉넉한 상한을 명시한다.
   */
  generateCharacter(id, photo) {
    const formData = new FormData()
    formData.append('photo', photo)
    return api.post(`/pets/${id}/character`, formData, { timeout: 120000 })
  },
}
