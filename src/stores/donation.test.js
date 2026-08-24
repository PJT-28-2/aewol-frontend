import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  addPreference: vi.fn(),
  removePreference: vi.fn(),
}))

vi.mock('@/api/donation', () => ({
  donationApi: {
    addPreference: mocks.addPreference,
    removePreference: mocks.removePreference,
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
