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

  disconnectRegistration(id) {
    return api.delete(`/pets/${id}/registration`)
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
   * AI 캐릭터 이미지 생성 접수
   * POST /api/pets/{petId}/character/jobs
   * body: photo (multipart, PNG/JPG/WEBP, 최대 10MB)
   * result: { jobId, petId, status: 'RUNNING' }
   *
   * 서버가 검증과 할당량 차감만 하고 곧바로 202로 끊는다. 생성은 백그라운드에서 돌고
   * 진행 상태는 fetchCharacterJob으로 확인한다.
   *
   * 예전에는 완성될 때까지 기다리는 방식이라 응답이 20초 이상 걸렸고, 그 사이 서버
   * 스레드가 묶이고 앞단 프록시 타임아웃에 걸릴 위험도 있었다.
   */
  submitCharacterJob(id, photo) {
    const formData = new FormData()
    formData.append('photo', photo)
    return api.post(`/pets/${id}/character/jobs`, formData)
  },

  /**
   * AI 캐릭터 생성 진행 상태 조회
   * GET /api/pets/{petId}/character/jobs/{jobId}
   * result: { status: 'RUNNING' | 'DONE' | 'FAILED', profileImg?, characterImg?, remainingToday?, message? }
   */
  fetchCharacterJob(id, jobId, timeout = 10000) {
    return api.get(`/pets/${id}/character/jobs/${jobId}`, { timeout })
  },
}
