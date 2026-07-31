import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    home: null,
    monthly: null,
  }),

  actions: {
    async fetchHome() {
      const { data } = await dashboardApi.getHome()
      this.home = data
      return data
    },

    async fetchMonthly(params) {
      const { data } = await dashboardApi.getMonthly(params)
      this.monthly = data
      return data
    },
  },
})
