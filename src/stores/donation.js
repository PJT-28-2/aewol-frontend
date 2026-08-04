import { defineStore } from 'pinia'
import { donationApi } from '@/api/donation'
import {
  donationCategories,
  savingUnits,
} from '@/constants/donation'
import { formatWon } from '@/utils/bankMeta'

const DEFAULT_CATEGORY = donationCategories[0]
const DEFAULT_SAVING_UNIT = savingUnits[savingUnits.length - 1]
const unwrap = (response) => response.data?.data

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
    isSubmitting: false,
    isInitialized: false,
    error: '',
    operationError: '',
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

    canDonate: (state) =>
      Boolean(state.selectedCampaignId) && state.amount > 0 && state.amount <= state.balance,

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
      this.operationError = ''

      try {
        const result = unwrap(await donationApi.getOverview())
        this.balance = Number(result?.balance ?? 0)
        this.monthlySaved = Number(result?.monthlySaved ?? 0)
        this.impactMessage = result?.impactMessage ?? ''
        this.campaigns = result?.campaigns ?? []

        const settings = result?.settings
        this.savingUnit = Number(settings?.savingUnit ?? DEFAULT_SAVING_UNIT)
        this.autoDonate = Boolean(settings?.autoDonate)
        this.piggyBankEnabled = settings?.piggyBankEnabled !== false
        this.savedSettings = {
          autoDonate: this.autoDonate,
          piggyBankEnabled: this.piggyBankEnabled,
          savingUnit: this.savingUnit,
        }

        const selectedExists = this.campaigns.some(
          (campaign) => campaign.id === this.selectedCampaignId,
        )
        if (!selectedExists) {
          this.selectedCampaignId =
            settings?.autoDonateCampaignId ?? this.campaigns[0]?.id ?? ''
        }
        this.isInitialized = true
      } catch (error) {
        this.campaigns = []
        this.selectedCampaignId = ''
        this.error = error.response?.data?.message || '저금통 정보를 불러오지 못했어요. 다시 시도해 주세요.'
      } finally {
        this.isLoading = false
      }
    },

    selectCampaign(campaignId) {
      if (!this.campaigns.some((campaign) => campaign.id === campaignId)) return
      this.selectedCampaignId = campaignId
      this.operationError = ''
    },

    setAmount(amount) {
      this.amount = amount
      this.operationError = ''
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

    async donate() {
      if (!this.canDonate || this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const idempotencyKey = globalThis.crypto?.randomUUID?.()
          ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const result = unwrap(await donationApi.donate({
          amount: this.amount,
          campaignId: this.selectedCampaignId,
          idempotencyKey,
        }))
        this.balance = Number(result.balance)
        const campaign = this.currentCampaign
        if (campaign) {
          campaign.raised += this.amount
          campaign.participants += 1
        }
        return true
      } catch (error) {
        this.operationError = error.response?.data?.message || '기부를 완료하지 못했어요. 다시 시도해 주세요.'
        return false
      } finally {
        this.isSubmitting = false
      }
    },

    setWithdrawAmount(amount) {
      const nextAmount = Number.isFinite(amount) ? Math.floor(amount) : 0
      this.withdrawAmount = Math.max(nextAmount, 0)
      this.withdrawError = ''
      this.operationError = ''
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
      this.operationError = ''
    },

    async withdraw() {
      if (!this.validateWithdrawAmount() || this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const result = unwrap(await donationApi.withdrawPot(this.withdrawAmount))
        this.balance = Number(result.balance)
        return true
      } catch (error) {
        this.operationError = error.response?.data?.message || '출금을 완료하지 못했어요. 다시 시도해 주세요.'
        return false
      } finally {
        this.isSubmitting = false
      }
    },

    async saveSettings() {
      if (this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const settings = unwrap(await donationApi.saveSettings({
          piggyBankEnabled: this.piggyBankEnabled,
          savingUnit: this.savingUnit,
          autoDonate: this.autoDonate,
          campaignId: this.autoDonate ? this.currentCampaign?.id : null,
        }))
        this.savingUnit = Number(settings.savingUnit)
        this.autoDonate = Boolean(settings.autoDonate)
        this.piggyBankEnabled = Boolean(settings.piggyBankEnabled)
        this.savedSettings = {
          autoDonate: this.autoDonate,
          piggyBankEnabled: this.piggyBankEnabled,
          savingUnit: this.savingUnit,
        }
        return true
      } catch (error) {
        this.operationError = error.response?.data?.message || '저금통 설정을 저장하지 못했어요. 다시 시도해 주세요.'
        return false
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
