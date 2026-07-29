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
    activities: [],
    isLoading: false,
    error: '',
    contributionError: '',
    lastInviteRecipient: '',
  }),

  actions: {
    fetchSharedCare(petId) {
      this.isLoading = true
      this.error = ''
      this.contributionError = ''

      const sharedCare = getMockSharedCare(petId)
      if (!sharedCare) {
        this.members = []
        this.contributions = []
        this.activities = []
        this.error = '공동 육아 정보를 불러오지 못했어요. 다시 시도해 주세요.'
        this.isLoading = false
        return
      }

      this.members = sharedCare.members
      this.contributions = sharedCare.contributions
      this.activities = sharedCare.activities

      this.isLoading = false
    },

    createMockInvite(recipient) {
      this.lastInviteRecipient = recipient
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
