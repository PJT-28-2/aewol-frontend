import api from './index'

export const groupPurchaseApi = {
  getList(params) {
    return api.get('/group-purchase', { params })
  },

  create(data) {
    return api.post('/group-purchase/create', data)
  },

  getDetail(id) {
    return api.get(`/group-purchase/${id}`)
  },

  getStatus(id) {
    return api.get(`/group-purchase/${id}/status`)
  },

  join(id) {
    return api.post(`/group-purchase/${id}/join`)
  },

  leave(id) {
    return api.post(`/group-purchase/${id}/leave`)
  },
}
