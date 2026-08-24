import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  addPreference: vi.fn(),
  removePreference: vi.fn(),
  saveSettings: vi.fn(),
  getOverview: vi.fn(),
  depositPot: vi.fn(),
  withdrawPot: vi.fn(),
}))

vi.mock('@/api/donation', () => ({
  donationApi: {
    addPreference: mocks.addPreference,
    removePreference: mocks.removePreference,
    saveSettings: mocks.saveSettings,
    getOverview: mocks.getOverview,
    depositPot: mocks.depositPot,
    withdrawPot: mocks.withdrawPot,
  },
}))

import { useDonationStore } from './donation'

const campaigns = () => [
  { id: 'campaign-1', organizationId: 'organization-1', organization: '카라', preferred: false },
  { id: 'campaign-2', organizationId: 'organization-1', organization: '카라', preferred: false },
  { id: 'campaign-3', organizationId: 'organization-2', organization: '동물자유연대', preferred: false },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('donation store 선호 기부처', () => {
  it('기부처를 등록하면 같은 단체의 모든 캠페인을 선호 상태로 맞춘다', async () => {
    const store = useDonationStore()
    store.campaigns = campaigns()
    mocks.addPreference.mockResolvedValue({
      data: { result: { organizationId: 'organization-1', preferred: true } },
    })

    expect(await store.togglePreference(store.campaigns[0])).toBe(true)

    expect(mocks.addPreference).toHaveBeenCalledWith('organization-1')
    expect(store.campaigns.map(({ preferred }) => preferred)).toEqual([true, true, false])
    expect(store.preferenceUpdatingIds).toEqual([])
  })

  it('선호 기부처를 해제하면 같은 단체의 캠페인을 모두 해제한다', async () => {
    const store = useDonationStore()
    store.campaigns = campaigns().map((campaign) =>
      campaign.organizationId === 'organization-1' ? { ...campaign, preferred: true } : campaign,
    )
    mocks.removePreference.mockResolvedValue({
      data: { result: { organizationId: 'organization-1', preferred: false } },
    })

    expect(await store.togglePreference(store.campaigns[0])).toBe(true)

    expect(mocks.removePreference).toHaveBeenCalledWith('organization-1')
    expect(store.campaigns.map(({ preferred }) => preferred)).toEqual([false, false, false])
  })

  it('저장 실패 시 기존 상태를 유지하고 오류를 안내한다', async () => {
    const store = useDonationStore()
    store.campaigns = campaigns()
    mocks.addPreference.mockRejectedValue({
      response: { data: { message: '기부처 저장 실패' } },
    })

    expect(await store.togglePreference(store.campaigns[0])).toBe(false)

    expect(store.campaigns.every(({ preferred }) => !preferred)).toBe(true)
    expect(store.operationError).toBe('기부처 저장 실패')
    expect(store.preferenceUpdatingIds).toEqual([])
  })
})

describe('donation store 저금통 설정', () => {
  it('임시 설정은 저장 요청이 성공한 뒤에만 스토어에 반영한다', async () => {
    const store = useDonationStore()
    store.campaigns = campaigns()
    store.piggyBankEnabled = true
    store.savingUnit = 1000
    store.autoDonate = false
    mocks.saveSettings.mockResolvedValue({
      data: {
        result: { piggyBankEnabled: false, savingUnit: 10, autoDonate: true },
      },
    })

    const result = await store.saveSettings({
      piggyBankEnabled: false,
      savingUnit: 10,
      autoDonate: true,
      campaignId: 'campaign-2',
    })

    expect(result).toBe(true)
    expect(mocks.saveSettings).toHaveBeenCalledWith({
      piggyBankEnabled: false,
      savingUnit: 10,
      autoDonate: true,
      campaignId: 'campaign-2',
    })
    expect(store.piggyBankEnabled).toBe(false)
    expect(store.savingUnit).toBe(10)
    expect(store.autoDonate).toBe(true)
    expect(store.selectedCampaignId).toBe('campaign-2')
  })

  it('저장 요청이 실패하면 기존 설정을 유지한다', async () => {
    const store = useDonationStore()
    store.piggyBankEnabled = true
    store.savingUnit = 1000
    store.autoDonate = false
    mocks.saveSettings.mockRejectedValue({
      response: { data: { message: '설정 저장 실패' } },
    })

    const result = await store.saveSettings({
      piggyBankEnabled: false,
      savingUnit: 10,
      autoDonate: true,
      campaignId: 'campaign-2',
    })

    expect(result).toBe(false)
    expect(store.piggyBankEnabled).toBe(true)
    expect(store.savingUnit).toBe(1000)
    expect(store.autoDonate).toBe(false)
    expect(store.operationError).toBe('설정 저장 실패')
  })
})

describe('donation store 저금통 넣기·출금', () => {
  it('개요에서 애월지갑 잔액을 읽어 넣기 한도로 쓴다', async () => {
    const store = useDonationStore()
    mocks.getOverview.mockResolvedValue({
      data: {
        result: {
          balance: 1200,
          walletBalance: 31275,
          monthlySaved: 400,
          impactMessage: '',
          campaigns: [],
          settings: { piggyBankEnabled: true, savingUnit: 1000, autoDonate: false },
        },
      },
    })

    await store.fetchDonationData()

    expect(store.balance).toBe(1200)
    expect(store.walletBalance).toBe(31275)
    expect(store.canDeposit).toBe(false)
  })

  it('넣기가 성공하면 저금통과 지갑 잔액을 함께 갱신하고 멱등키를 보낸다', async () => {
    const store = useDonationStore()
    store.balance = 1200
    store.walletBalance = 31275
    store.monthlySaved = 400
    store.setDepositAmount(2000)
    mocks.depositPot.mockResolvedValue({
      data: { result: { balance: 3200 } },
    })

    expect(await store.deposit()).toBe(true)

    expect(mocks.depositPot).toHaveBeenCalledWith(2000, expect.any(String))
    expect(store.balance).toBe(3200)
    expect(store.walletBalance).toBe(29275)
    expect(store.monthlySaved).toBe(2400)
    expect(store.pendingDepositKey).toBeNull()
  })

  it('같은 금액으로 넣기를 다시 시도하면 이전 멱등키를 그대로 쓴다', async () => {
    const store = useDonationStore()
    store.walletBalance = 10000
    store.setDepositAmount(3000)
    mocks.depositPot.mockRejectedValueOnce({
      response: { data: { message: '잠시 후 다시 시도해 주세요.' } },
    })

    expect(await store.deposit()).toBe(false)
    const firstKey = mocks.depositPot.mock.calls[0][1]

    mocks.depositPot.mockResolvedValue({
      data: { result: { balance: 4200 } },
    })
    expect(await store.deposit()).toBe(true)
    expect(mocks.depositPot.mock.calls[1][1]).toBe(firstKey)
  })

  it('출금 요청에 멱등키를 실어 보낸다', async () => {
    const store = useDonationStore()
    store.balance = 5000
    store.walletBalance = 1000
    store.setWithdrawAmount(2000)
    mocks.withdrawPot.mockResolvedValue({
      data: { result: { balance: 3000 } },
    })

    expect(await store.withdraw()).toBe(true)

    expect(mocks.withdrawPot).toHaveBeenCalledWith(2000, expect.any(String))
    expect(store.balance).toBe(3000)
    expect(store.walletBalance).toBe(3000)
  })
})

describe('donation store 시연 캠페인', () => {
  it('donatable이 false이면 기부할 수 없다', () => {
    const store = useDonationStore()
    store.balance = 10000
    store.amount = 3000
    store.selectedCampaignId = 'demo-1'
    store.campaigns = [
      { id: 'demo-1', title: '[시연] 캠페인', donatable: false },
    ]

    expect(store.isCurrentCampaignDonatable).toBe(false)
    expect(store.canDonate).toBe(false)
  })

  it('donatable 필드가 없으면 기존처럼 기부할 수 있다', () => {
    const store = useDonationStore()
    store.balance = 10000
    store.amount = 3000
    store.selectedCampaignId = 'campaign-1'
    store.campaigns = campaigns()

    expect(store.isCurrentCampaignDonatable).toBe(true)
    expect(store.canDonate).toBe(true)
  })
})
