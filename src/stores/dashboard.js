import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    category: null,
  }),

  actions: {
    async fetchSummary(params) {
      const epoch = beginSessionTask()
      try {
        const { data } = await dashboardApi.getSummary(params)
        if (!isCurrentSession(epoch)) return this.summary
        this.summary = data.result ?? data
        return this.summary
      } catch (error) {
        if (!isCurrentSession(epoch)) throw error
        this.summary = null
        throw error
      }
    },

    async fetchCategory(params) {
      const epoch = beginSessionTask()
      try {
        const { data } = await dashboardApi.getCategory(params)
        if (!isCurrentSession(epoch)) return this.category
        this.category = data.result ?? data
        return this.category
      } catch (error) {
        if (!isCurrentSession(epoch)) throw error
        this.category = null
        throw error
      }
    },
  },
})
