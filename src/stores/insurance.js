import { defineStore } from 'pinia'
import { insuranceApi } from '@/api/insurance'

export const useInsuranceStore = defineStore('insurance', {
  state: () => ({
    simulations: [],
    claims: [],
    currentClaim: null,
    claimDraft: null,
  }),

  actions: {
    async simulate(data) {
      const { data: result } = await insuranceApi.simulate(data)
      this.simulations.push(result)
      return result
    },

    async fetchClaims(params) {
      const { data } = await insuranceApi.getClaims(params)
      this.claims = data
      return data
    },

    async submitClaim(claimData) {
      const { data } = await insuranceApi.submitClaim(claimData)
      this.claims.unshift(data)
      return data
    },

    setClaimDraft(draft) {
      this.claimDraft = draft
    },

    clearClaimDraft() {
      this.claimDraft = null
    },

    async confirmClaim(id) {
      const { data } = await insuranceApi.confirmClaim(id)
      const index = this.claims.findIndex((c) => c.id === id)
      if (index !== -1) this.claims[index] = data
      if (this.currentClaim?.id === id) this.currentClaim = data
      return data
    },
  },
})
