import { defineStore } from 'pinia'
import { memberApi } from '@/api/member'
import { repairKoreanMojibake } from '@/utils/text'
import { useAccountStore } from '@/stores/account'

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
      // 간편비밀번호(PIN) 설정 여부는 서버가 진실의 원천(source of truth)이다.
      // 로그인/새로고침 시 프로필을 다시 불러올 때마다 로컬(account 스토어의
      // hasSimplePassword, localStorage)을 서버 값으로 동기화해서, 다른 기기에서
      // PIN을 설정/해제했을 때 로컬 상태가 낡은 채로 남아있지 않도록 한다(2026-08-13).
      useAccountStore().setHasSimplePassword(this.profile?.hasSimplePassword)
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
