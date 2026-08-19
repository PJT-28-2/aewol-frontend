import api from './index'

export const shareApi = {
  getPets() {
    return api.get('/share/pets')
  },

  invite(data) {
    return api.post('/share/invite', data)
  },

  createLinkInvite(data) {
    return api.post('/share/invite/link', data)
  },

  getInvite(inviteCode) {
    return api.get(`/share/invites/${inviteCode}`)
  },

  acceptInvite(inviteCode) {
    return api.post(`/share/invites/${inviteCode}/accept`)
  },

  getMembers(petId) {
    return api.get(`/share/${petId}/members`)
  },

  respondInvite(accessId, status) {
    return api.put(`/share/${accessId}`, null, { params: { status } })
  },

  updateRole(memberId, petId, role) {
    return api.patch(`/share/members/${memberId}/role`, { petId, role })
  },

  removeMember(memberId, petId) {
    return api.delete(`/share/members/${memberId}`, { params: { petId } })
  },

  getContributions(petId) {
    return api.get('/share/contributions', { params: { petId } })
  },

  getLogs(petId) {
    return api.get('/share/logs', { params: { petId } })
  },

  // ── 공동육아 일기 ──────────────────────────────────────────────

  getDiaries(petId, yearMonth) {
    return api.get(`/share/${petId}/diaries`, { params: { yearMonth } })
  },

  getDiary(diaryId) {
    return api.get(`/share/diaries/${diaryId}`)
  },

  // 사진을 함께 보내야 해서 multipart로 전송한다. Content-Type은 브라우저가
  // boundary와 함께 자동으로 채우므로 직접 지정하지 않는다.
  createDiary({ petId, diaryDate, content, image }) {
    const formData = new FormData()
    formData.append('diaryDate', diaryDate)
    if (content) formData.append('content', content)
    if (image) formData.append('image', image)
    return api.post(`/share/${petId}/diaries`, formData)
  },

  // version은 조회할 때 받은 값을 그대로 되돌려 보낸다. 그 사이 다른 곳에서 저장됐으면
  // 서버가 409로 거절해 앞선 수정이 덮어써지지 않는다.
  updateDiary(diaryId, { diaryDate, content, version }) {
    return api.put(`/share/diaries/${diaryId}`, { diaryDate, content, version })
  },

  deleteDiary(diaryId) {
    return api.delete(`/share/diaries/${diaryId}`)
  },
}
