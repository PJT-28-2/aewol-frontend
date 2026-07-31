import { defineStore } from 'pinia'
import {
  getMockSharedCare,
  MOCK_INVITE_CODE,
  mockSharePets,
} from '@/mocks/share'

export const useShareStore = defineStore('share', {
  state: () => ({
    pets: mockSharePets.map((pet) => ({ ...pet })),
    members: [],
    contributions: [],
    isLoading: false,
    error: '',
  }),

  actions: {
    fetchSharedCare(petId) {
      this.isLoading = true
      this.error = ''

      const sharedCare = getMockSharedCare(petId)
      if (!sharedCare) {
        this.members = []
        this.contributions = []
        this.error = '공동 육아 정보를 불러오지 못했어요. 다시 시도해 주세요.'
        this.isLoading = false
        return
      }

      this.members = sharedCare.members
      this.contributions = sharedCare.contributions

      this.isLoading = false
    },

    createMockInvite(recipient) {
      return {
        code: MOCK_INVITE_CODE,
        recipient,
      }
    },

    joinMockSharedCare() {
      this.error = ''
      return true
    },
  },
})
