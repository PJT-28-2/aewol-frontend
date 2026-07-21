import { defineStore } from 'pinia'
import { memberApi } from '@/api/member'

export const useMemberStore = defineStore('member', {
  state: () => ({
    profile: null,
  }),

  actions: {
    async fetchProfile() {
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
