import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  addPreference: vi.fn(),
  removePreference: vi.fn(),
  saveSettings: vi.fn(),
}))

vi.mock('@/api/donation', () => ({
  donationApi: {
    addPreference: mocks.addPreference,
    removePreference: mocks.removePreference,
    saveSettings: mocks.saveSettings,
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
