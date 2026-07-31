import { defineStore } from 'pinia'
import {
  donationCategories,
  mockCampaigns,
  mockDonationPot,
  savingUnits,
} from '@/mocks/donation'
import { formatWon } from '@/utils/bankMeta'

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
    withdrawAmount: 0,
    withdrawError: '',
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

    canWithdraw: (state) =>
      state.withdrawAmount > 0 && state.withdrawAmount <= state.balance,

    balanceAfterWithdraw: (state) =>
      Math.max(state.balance - state.withdrawAmount, 0),

    isFiltering: (state) =>
      Boolean(state.searchKeyword.trim()) ||
      state.activeCategory !== DEFAULT_CATEGORY,
  },

  actions: {
    async fetchDonationData() {
      this.isLoading = true
      this.error = ''

      try {
        // TODO: 백엔드 /api/donation 구현 후 donationApi 호출로 교체한다.
        const { balance, impactMessage, monthlySaved } = mockDonationPot
        const campaigns = mockCampaigns.map((campaign) => ({ ...campaign }))

        if (!campaigns.length) throw new Error('EMPTY_CAMPAIGNS')

        this.balance = balance
        this.monthlySaved = monthlySaved
        this.impactMessage = impactMessage
        this.campaigns = campaigns
        this.selectedCampaignId = this.currentCampaign?.id ?? ''
      } catch {
        this.campaigns = []
        this.selectedCampaignId = ''
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

    /** 1원 단위 출금을 허용하므로 정수 여부만 보정하고 상한 검증은 블러 시점에 한다. */
    setWithdrawAmount(amount) {
      const nextAmount = Number.isFinite(amount) ? Math.floor(amount) : 0

      this.withdrawAmount = Math.max(nextAmount, 0)
      this.withdrawError = ''
    },

    validateWithdrawAmount() {
      if (this.withdrawAmount <= 0) {
        this.withdrawError = '출금할 금액을 입력해주세요.'
        return false
      }

      if (this.withdrawAmount > this.balance) {
        this.withdrawError = `저금통 잔액 ${formatWon(this.balance)}을 초과했어요.`
        return false
      }

      this.withdrawError = ''
      return true
    },

    resetWithdraw() {
      this.withdrawAmount = 0
      this.withdrawError = ''
    },

    withdraw() {
      if (!this.validateWithdrawAmount()) return false

      // TODO: 백엔드 /api/donation/pot/withdraw 구현 후 donationApi.withdrawPot 호출로 교체한다.
      this.balance -= this.withdrawAmount
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
