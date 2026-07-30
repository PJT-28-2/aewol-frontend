import { defineStore } from 'pinia'
import {
  donationCategories,
  mockCampaigns,
  mockDonationPot,
  savingUnits,
} from '@/mocks/donation'

const DEFAULT_CATEGORY = donationCategories[0]
const DEFAULT_SAVING_UNIT = savingUnits[savingUnits.length - 1]

export const useDonationStore = defineStore('donation', {
  state: () => ({
    balance: 0,
    monthlySaved: 0,
    impactMessage: '',
    amount: 3000,
    campaigns: [],
    selectedCampaignId: '',
    searchKeyword: '',
    activeCategory: DEFAULT_CATEGORY,
    savingUnit: DEFAULT_SAVING_UNIT,
    autoDonate: false,
    piggyBankEnabled: true,
    savedSettings: {
      autoDonate: false,
      piggyBankEnabled: true,
      savingUnit: DEFAULT_SAVING_UNIT,
    },
    isLoading: true,
    error: '',
  }),

  getters: {
    hasCampaigns: (state) => state.campaigns.length > 0,

    currentCampaign: (state) =>
      state.campaigns.find(
        (campaign) => campaign.id === state.selectedCampaignId,
      ) ?? state.campaigns[0],

    preferredCampaigns: (state) =>
      state.campaigns.filter((campaign) => campaign.preferred),

    filteredCampaigns: (state) => {
      const keyword = state.searchKeyword.trim().toLowerCase()

      return state.campaigns.filter((campaign) => {
        const matchesCategory =
          state.activeCategory === DEFAULT_CATEGORY ||
          campaign.category === state.activeCategory
        const matchesKeyword =
          !keyword ||
          campaign.title.toLowerCase().includes(keyword) ||
          campaign.organization.toLowerCase().includes(keyword)

        return matchesCategory && matchesKeyword
      })
    },

    canDonate: (state) => state.amount > 0 && state.amount <= state.balance,

    balanceAfterDonation: (state) => Math.max(state.balance - state.amount, 0),

    isFiltering: (state) =>
      Boolean(state.searchKeyword.trim()) ||
      state.activeCategory !== DEFAULT_CATEGORY,
  },

  actions: {
    fetchDonationData() {
      this.isLoading = true
      this.error = ''

      try {
        this.balance = mockDonationPot.balance
        this.monthlySaved = mockDonationPot.monthlySaved
        this.impactMessage = mockDonationPot.impactMessage
        this.campaigns = mockCampaigns.map((campaign) => ({ ...campaign }))

        if (!this.currentCampaign) return

        this.selectedCampaignId = this.currentCampaign.id
      } catch {
        this.error = '저금통 정보를 불러오지 못했어요. 다시 시도해 주세요.'
      } finally {
        this.isLoading = false
      }
    },

    selectCampaign(campaignId) {
      if (!this.campaigns.some((campaign) => campaign.id === campaignId)) return

      this.selectedCampaignId = campaignId
    },

    setAmount(amount) {
      this.amount = amount
    },

    setSearchKeyword(keyword) {
      this.searchKeyword = keyword
    },

    setCategory(category) {
      if (!donationCategories.includes(category)) return

      this.activeCategory = category
    },

    setSavingUnit(unit) {
      if (!savingUnits.includes(unit)) return

      this.savingUnit = unit
    },

    setPiggyBankEnabled(enabled) {
      this.piggyBankEnabled = enabled
    },

    setAutoDonate(enabled) {
      this.autoDonate = enabled
    },

    donate() {
      if (!this.canDonate) return false

      this.balance -= this.amount
      return true
    },

    saveSettings() {
      this.savedSettings = {
        autoDonate: this.autoDonate,
        piggyBankEnabled: this.piggyBankEnabled,
        savingUnit: this.savingUnit,
      }
    },
  },
})
