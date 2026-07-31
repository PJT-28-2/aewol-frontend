import { defineStore } from 'pinia'
import { mockSupportPrograms } from '@/mocks/supportPrograms'

export const useSupportProgramsStore = defineStore('supportPrograms', {
  state: () => ({
    programs: [],
    appliedProgramIds: [],
    isLoading: true,
    error: '',
  }),

  actions: {
    fetchPrograms() {
      this.isLoading = true
      this.error = ''

      try {
        this.programs = mockSupportPrograms.map((program) => ({
          ...program,
          conditions: program.conditions.map((condition) => ({ ...condition })),
        }))
      } catch {
        this.error = '지원사업 정보를 불러오지 못했어요. 다시 시도해 주세요.'
      } finally {
        this.isLoading = false
      }
    },

    applyForProgram(programId) {
      if (!this.appliedProgramIds.includes(programId)) {
        this.appliedProgramIds.push(programId)
      }
    },
  },
})
