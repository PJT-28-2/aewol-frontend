import api from './index'

export const shareApi = {
  invite(data) {
    return api.post('/share/invite', data)
  },

  getMembers() {
    return api.get('/share')
  },

  respondInvite(accessId, status) {
    return api.put(`/share/${accessId}`, null, { params: { status } })
  },

  updateRole(memberId, role) {
    return api.patch(`/share/members/${memberId}/role`, { role })
  },

  removeMember(memberId) {
    return api.delete(`/share/members/${memberId}`)
  },

  getContributions(params) {
    return api.get('/share/contributions', { params })
  },

  getLogs(params) {
    return api.get('/share/logs', { params })
  },
}
