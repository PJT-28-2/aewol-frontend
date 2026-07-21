import api from './index'

export const supportApi = {
  getPrograms(params) {
    return api.get('/support/programs', { params })
  },

  getProgram(id) {
    return api.get(`/support/programs/${id}`)
  },
}
