import { defineStore } from 'pinia'
import { shareApi } from '@/api/share'

function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? []
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback
}

export const useShareStore = defineStore('share', {
  state: () => ({
    members: [],
    contributions: [],
    isLoading: false,
    error: '',
    contributionError: '',
  }),

  actions: {
    async fetchSharedCare(petId) {
      this.isLoading = true
      this.error = ''
      this.contributionError = ''

      const [membersResult, contributionsResult] = await Promise.allSettled([
        shareApi.getMembers(),
        shareApi.getContributions({ petId }),
      ])

      if (membersResult.status === 'fulfilled') {
        const members = unwrapData(membersResult.value)
        this.members = Array.isArray(members) ? members : []
      } else {
        this.members = []
        this.error = getErrorMessage(
          membersResult.reason,
          '공동육아 가족 정보를 불러오지 못했어요.',
        )
      }

      if (contributionsResult.status === 'fulfilled') {
        const contributions = unwrapData(contributionsResult.value)
        this.contributions = Array.isArray(contributions) ? contributions : []
      } else {
        this.contributions = []
        this.contributionError = getErrorMessage(
          contributionsResult.reason,
          '기여도 집계 정보를 불러오지 못했어요.',
        )
      }

      this.isLoading = false
    },
  },
})
