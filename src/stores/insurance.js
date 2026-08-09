import { defineStore } from 'pinia'
import { insuranceApi } from '@/api/insurance'

export const useInsuranceStore = defineStore('insurance', {
  state: () => ({
    products: [],
    simulations: [],
    claims: [],
    currentClaim: null,
    claimDraft: null,
  }),

  actions: {
    async fetchProducts(params) {
      const { data } = await insuranceApi.getProducts(params)
      this.products = data.result
      return this.products
    },

    async simulate(payload) {
      const { data } = await insuranceApi.simulate(payload)
      this.simulations.push(data.result)
      return data.result
    },

    async fetchClaims(params) {
      const { data } = await insuranceApi.getClaims(params)
      this.claims = data.result
      return this.claims
    },

    async fetchClaim(id) {
      const { data } = await insuranceApi.getClaim(id)
      this.currentClaim = data.result
      return this.currentClaim
    },

    async submitClaim(petId, receiptFile) {
      const { data } = await insuranceApi.submitClaim(petId, receiptFile)
      this.claims.unshift(data.result)
      return data.result
    },

    setClaimDraft(draft) {
      this.claimDraft = draft
    },

    clearClaimDraft() {
      this.claimDraft = null
    },

    async confirmClaim(id, correctedData) {
      const { data } = await insuranceApi.confirmClaim(id, correctedData)
      const updated = data.result
      const index = this.claims.findIndex((c) => c.claimId === id)
      if (index !== -1) this.claims[index] = updated
      if (this.currentClaim?.claimId === id) this.currentClaim = updated
      return updated
    },
  },
})
