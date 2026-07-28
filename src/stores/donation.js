import { defineStore } from 'pinia'

const DEFAULT_CAMPAIGN = '행복한 유기동물보호소'

export const useDonationStore = defineStore('donation', {
  state: () => ({
    balance: 12400,
    amount: 3000,
    selectedCampaign: DEFAULT_CAMPAIGN,
    autoDonate: false,
    piggyBankEnabled: true,
    savedSettings: {
      autoDonate: false,
      piggyBankEnabled: true,
    },
  }),

  getters: {
    canDonate: (state) => state.amount > 0 && state.amount <= state.balance,
  },

  actions: {
    donate() {
      if (!this.canDonate) return false

      this.balance -= this.amount
      return true
    },

    saveSettings() {
      this.savedSettings = {
        autoDonate: this.autoDonate,
        piggyBankEnabled: this.piggyBankEnabled,
      }
    },
  },
})
