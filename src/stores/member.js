import { defineStore } from 'pinia'
import { memberApi } from '@/api/member'
import { repairKoreanMojibake } from '@/utils/text'

const normalizeProfile = (profile) => ({
  ...profile,
  name: repairKoreanMojibake(profile?.name),
})

export const useMemberStore = defineStore('member', {
  state: () => ({
    profile: null,
  }),

  actions: {
    async fetchProfile() {
      const { data } = await memberApi.getProfile()
      this.profile = normalizeProfile(data.result ?? data)
      return this.profile
    },

    async updateProfile(profileData) {
      await memberApi.updateProfile(profileData)
      return this.fetchProfile()
    },

    async verifyPassword(currentPassword) {
      await memberApi.verifyPassword(currentPassword)
    },

    async changePassword(currentPassword, newPassword) {
      await memberApi.changePassword(currentPassword, newPassword)
    },

    async withdraw(currentPassword) {
      await memberApi.withdraw(currentPassword)
      this.clearProfile()
    },

    clearProfile() {
      this.profile = null
    },
  },
})
