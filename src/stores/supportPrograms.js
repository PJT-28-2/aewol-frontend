import { defineStore } from 'pinia'
import { supportProgramsApi } from '@/api/supportPrograms'

const unwrap = (response) => response.data?.data

export const useSupportProgramsStore = defineStore('supportPrograms', {
  state: () => ({
    petId: '',
    petName: '',
    programs: [],
    appliedProgramIds: [],
    isLoading: true,
    isApplying: false,
    error: '',
  }),

  actions: {
    async fetchPrograms(petId = '') {
      this.isLoading = true
      this.error = ''

      try {
        const result = unwrap(await supportProgramsApi.getMatchedPrograms(petId))
        this.petId = result?.petId ?? ''
        this.petName = result?.petName ?? ''
        this.programs = result?.programs ?? []
        this.appliedProgramIds = this.programs
          .filter((program) => program.applied)
          .map((program) => program.id)
      } catch (error) {
        this.programs = []
        this.appliedProgramIds = []
        this.error = error.response?.data?.message || '지원사업 정보를 불러오지 못했어요. 다시 시도해 주세요.'
      } finally {
        this.isLoading = false
      }
    },

    async applyForProgram(programId) {
      // 진행 중이거나 이미 신청한 건은 재요청하지 않는다
      if (
        !this.petId ||
        this.isApplying ||
        this.appliedProgramIds.includes(programId)
      ) {
        return false
      }
      this.isApplying = true
      this.error = ''
      try {
        await supportProgramsApi.markApplyPageOpened(programId, this.petId)
        if (!this.appliedProgramIds.includes(programId)) {
          this.appliedProgramIds.push(programId)
        }
        const program = this.programs.find((item) => item.id === programId)
        if (program) program.applied = true
        return true
      } catch (error) {
        this.error = error.response?.data?.message || '신청 상태를 저장하지 못했어요. 다시 시도해 주세요.'
        return false
      } finally {
        this.isApplying = false
      }
    },
  },
})
