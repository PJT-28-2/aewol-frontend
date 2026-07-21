import api from './index'

export const emergencyApi = {
  searchHospitals(params) {
    return api.get('/emergency/hospitals', { params })
  },

  getHospital(id) {
    return api.get(`/emergency/hospitals/${id}`)
  },
}
