import { defineStore } from 'pinia'
import { memberApi } from '@/api/member'
import { USE_MOCK_DATA } from '@/mocks/config'
import { MOCK_MEMBER_PROFILE } from '@/mocks/member'
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
      if (USE_MOCK_DATA) {
        this.profile = normalizeProfile(structuredClone(MOCK_MEMBER_PROFILE))
        return this.profile
      }
      const { data } = await memberApi.getProfile()
      this.profile = normalizeProfile(data.result ?? data)
      return this.profile
    },

    async updateProfile(profileData) {
      await memberApi.updateProfile(profileData)
      return this.fetchProfile()
    },

    setPetProfilePhoto(url) {
      this.petProfilePhotoUrl = url
    },
  },
})
