import api from './index'

export const supportProgramsApi = {
  getMatchedPrograms(petId) {
    return api.get('/support/matched', { params: petId ? { petId } : {} })
  },

  markApplyPageOpened(programId, petId) {
    return api.post(`/support/${programId}/interest`, { petId })
  },
}
