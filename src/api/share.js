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
}
