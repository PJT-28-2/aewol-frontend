import { defineStore } from 'pinia'
import { donationApi } from '@/api/donation'
import {
  donationCategories,
  savingUnits,
} from '@/constants/donation'
import { formatWon } from '@/utils/bankMeta'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'

const DEFAULT_CATEGORY = donationCategories[0]
const DEFAULT_SAVING_UNIT = savingUnits[savingUnits.length - 1]
// 백엔드 공통 응답은 { status, message, result } 래퍼라 실제 페이로드는 data.result에 있다
const unwrap = (response) => response.data?.result

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
    // 응답만 유실된 재시도에서 서버가 같은 기부를 두 번 처리하지 않도록
    // (campaignId, amount) 조합에 묶인 멱등키를 성공 전까지 보관한다.
    pendingDonationKey: null,
    pendingDonationSignature: '',
    withdrawAmount: 0,
    withdrawError: '',
    isLoading: true,
    isSubmitting: false,
    isInitialized: false,
    error: '',
    operationError: '',
    preferenceUpdatingIds: [],
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
      const epoch = beginSessionTask()
      this.isLoading = true
      this.error = ''
      this.operationError = ''

      try {
        const result = unwrap(await donationApi.getOverview())
        if (!isCurrentSession(epoch)) return
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
        if (!isCurrentSession(epoch)) return
        this.campaigns = []
        this.selectedCampaignId = ''
        this.error = error.response?.data?.message || '저금통 정보를 불러오지 못했어요. 다시 시도해 주세요.'
      } finally {
        if (isCurrentSession(epoch)) this.isLoading = false
      }
    },

    selectCampaign(campaignId) {
      if (this.isSubmitting) return
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
      if (this.isSubmitting) return
      if (!savingUnits.includes(unit)) return
      this.savingUnit = unit
    },

    setPiggyBankEnabled(enabled) {
      if (this.isSubmitting) return
      this.piggyBankEnabled = enabled
    },

    setAutoDonate(enabled) {
      if (this.isSubmitting) return
      this.autoDonate = enabled
    },

    async togglePreference(campaign) {
      const organizationId = campaign?.organizationId
      if (!organizationId || this.preferenceUpdatingIds.includes(organizationId)) return false

      const preferred = !campaign.preferred
      this.preferenceUpdatingIds.push(organizationId)
      this.operationError = ''
      try {
        const request = preferred
          ? donationApi.addPreference(organizationId)
          : donationApi.removePreference(organizationId)
        const result = unwrap(await request)
        const saved = Boolean(result?.preferred)
        this.campaigns = this.campaigns.map((item) =>
          item.organizationId === organizationId ? { ...item, preferred: saved } : item,
        )
        return true
      } catch (error) {
        this.operationError = error.response?.data?.message
          || '선호 기부처를 저장하지 못했어요. 다시 시도해 주세요.'
        return false
      } finally {
        this.preferenceUpdatingIds = this.preferenceUpdatingIds.filter(
          (id) => id !== organizationId,
        )
      }
    },

    async donate() {
      if (!this.canDonate || this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const idempotencyKey = this.resolveDonationKey()
        const result = unwrap(await donationApi.donate({
          amount: this.amount,
          campaignId: this.selectedCampaignId,
          idempotencyKey,
        }))
        this.clearDonationKey()
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

    /**
     * 같은 캠페인·금액으로 다시 시도하면 이전 키를 그대로 쓴다.
     * 캠페인이나 금액이 바뀌면 다른 기부이므로 새 키를 만든다.
     */
    resolveDonationKey() {
      const signature = `${this.selectedCampaignId}:${this.amount}`
      if (this.pendingDonationKey && this.pendingDonationSignature === signature) {
        return this.pendingDonationKey
      }
      this.pendingDonationSignature = signature
      this.pendingDonationKey = globalThis.crypto?.randomUUID?.()
        ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      return this.pendingDonationKey
    },

    clearDonationKey() {
      this.pendingDonationKey = null
      this.pendingDonationSignature = ''
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

    async saveSettings(draft = {}) {
      if (this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const payload = {
          piggyBankEnabled: draft.piggyBankEnabled ?? this.piggyBankEnabled,
          savingUnit: draft.savingUnit ?? this.savingUnit,
          autoDonate: draft.autoDonate ?? this.autoDonate,
          campaignId: draft.campaignId !== undefined
            ? draft.campaignId
            : (this.autoDonate ? this.currentCampaign?.id : null),
        }
        const settings = unwrap(await donationApi.saveSettings(payload))
        this.savingUnit = Number(settings.savingUnit)
        this.autoDonate = Boolean(settings.autoDonate)
        this.piggyBankEnabled = Boolean(settings.piggyBankEnabled)
        if (payload.campaignId) this.selectedCampaignId = payload.campaignId
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
