import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    category: null,
  }),

  actions: {
    async fetchSummary(params) {
      const { data } = await dashboardApi.getSummary(params)
      this.summary = data
      return data
    },

    async fetchCategory(params) {
      const { data } = await dashboardApi.getCategory(params)
      this.category = data
      return data
    },
  },
})
