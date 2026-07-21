import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    trend: [],
    comparison: null,
  }),

  actions: {
    async fetchSummary(params) {
      const { data } = await dashboardApi.getSummary(params)
      this.summary = data
      return data
    },

    async fetchTrend(params) {
      const { data } = await dashboardApi.getTrend(params)
      this.trend = data
      return data
    },

    async fetchComparison(params) {
      const { data } = await dashboardApi.getComparison(params)
      this.comparison = data
      return data
    },
  },
})
