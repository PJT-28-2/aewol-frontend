import { defineStore } from 'pinia'
import { memberApi } from '@/api/member'
import { USE_MOCK_DATA } from '@/mocks/config'
import { MOCK_MEMBER_PROFILE } from '@/mocks/member'

export const useMemberStore = defineStore('member', {
  state: () => ({
    profile: null,
  }),

  actions: {
    async fetchProfile() {
      if (USE_MOCK_DATA) {
        this.profile = structuredClone(MOCK_MEMBER_PROFILE)
        return this.profile
      }
      const { data } = await memberApi.getProfile()
      this.profile = data
      return data
    },

    async updateProfile(profileData) {
      const { data } = await memberApi.updateProfile(profileData)
      this.profile = data
      return data
    },
  },
})
