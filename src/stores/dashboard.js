import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    category: null,
  }),

  actions: {
    async fetchSummary(params) {
      try {
        const { data } = await dashboardApi.getSummary(params)
        this.summary = data.result ?? data
        return this.summary
      } catch (error) {
        this.summary = null
        throw error
      }
    },

    async fetchCategory(params) {
      try {
        const { data } = await dashboardApi.getCategory(params)
        this.category = data.result ?? data
        return this.category
      } catch (error) {
        this.category = null
        throw error
      }
    },
  },
})
