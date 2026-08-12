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
    // TODO(backend): AI 프로필 사진 변환 API 연동 전이라 로컬 상태로만 관리
    petProfilePhotoUrl: null,
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
      this.petProfilePhotoUrl = null
    },

    setPetProfilePhoto(url) {
      this.petProfilePhotoUrl = url
    },
  },
})
