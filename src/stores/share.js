import { defineStore } from 'pinia'
import {
  getMockSharedCare,
  MOCK_INVITE_CODE,
  mockSharePets,
} from '@/mocks/share'

export const useShareStore = defineStore('share', {
  state: () => ({
    pets: mockSharePets,
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
