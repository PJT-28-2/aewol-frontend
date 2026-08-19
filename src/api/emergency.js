import api from './index'

export const emergencyApi = {
  searchHospitals(params, config) {
    return api.get('/emergency/hospitals', { params, ...config })
  },

  getHospital(id) {
    return api.get(`/emergency/hospitals/${id}`)
  },
}
