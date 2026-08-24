import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'
import { resetUserStores } from './resetUserStores'
import { useAccountStore } from './account'
import { useDashboardStore } from './dashboard'
import { useDonationStore } from './donation'
import { useInsuranceStore } from './insurance'
import { useMemberStore } from './member'
import { usePaymentStore } from './payment'
import { usePetStore } from './pet'
import { useShareStore } from './share'
import { useWalletStore } from './wallet'

vi.mock('@/api/donation', () => ({
  donationApi: {
    getOverview: vi.fn(),
  },
}))

vi.mock('@/api/recurring', () => ({
  recurringApi: {
    getRecurrings: vi.fn(),
  },
}))

import { donationApi } from '@/api/donation'
import { recurringApi } from '@/api/recurring'

describe('resetUserStores', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('로그아웃 시 기부·정기결제 캐시 플래그와 계정 데이터를 비운다', () => {
    const donation = useDonationStore()
    donation.balance = 9000
    donation.isInitialized = true
    donation.selectedCampaignId = 'camp-a'

    const payment = usePaymentStore()
    payment.recurringPayments = [{ id: '1', merchantName: '이전 계정 정기결제' }]
    payment.hasFetchedRecurringPayments = true

    const account = useAccountStore()
    account.accounts = [{ accountId: 'acc-a' }]
    account.setHasSimplePassword(true)

    const member = useMemberStore()
    member.profile = { name: '이전 사용자' }

    const insurance = useInsuranceStore()
    insurance.claimDraft = { hospitalName: '이전 병원' }

    const dashboard = useDashboardStore()
    dashboard.summary = { walletBalance: 1 }

    const share = useShareStore()
    share.pets = [{ id: 'pet-a' }]

    resetUserStores()

    expect(donation.isInitialized).toBe(false)
    expect(donation.balance).toBe(0)
    expect(donation.selectedCampaignId).toBe('')
    expect(payment.hasFetchedRecurringPayments).toBe(false)
    expect(payment.recurringPayments).toEqual([])
    expect(account.accounts).toEqual([])
    expect(account.hasSimplePassword).toBe(false)
    expect(localStorage.getItem('hasSimplePassword')).toBeNull()
    expect(member.profile).toBeNull()
    expect(insurance.claimDraft).toBeNull()
    expect(dashboard.summary).toBeNull()
    expect(share.pets).toEqual([])
  })

  it('대표 반려동물 localStorage 키를 계정과 함께 지운다', () => {
    localStorage.setItem('representativePetId', '1')
    setActivePinia(createPinia())
    const pet = usePetStore()
    pet.pets = [{ id: '1', petId: '1' }]
    pet.representativePetId = '1'

    resetUserStores()

    expect(pet.pets).toEqual([])
    expect(pet.representativePetId).toBeNull()
    expect(localStorage.getItem('representativePetId')).toBeNull()
  })

  it('로그아웃 전에 시작한 기부 조회는 새 세션 상태를 채우지 않는다', async () => {
    let resolveOverview
    donationApi.getOverview.mockReturnValue(
      new Promise((resolve) => {
        resolveOverview = resolve
      }),
    )
    const donation = useDonationStore()
    const pending = donation.fetchDonationData()
    const epoch = beginSessionTask()

    resetUserStores()
    expect(isCurrentSession(epoch)).toBe(false)

    resolveOverview({
      data: {
        result: {
          balance: 9999,
          monthlySaved: 1,
          campaigns: [{ id: 'stale', title: '이전 기부처' }],
          settings: {},
        },
      },
    })
    await pending

    expect(donation.balance).toBe(0)
    expect(donation.isInitialized).toBe(false)
    expect(donation.campaigns).toEqual([])
  })

  it('로그아웃 전에 시작한 정기결제 조회는 새 세션 목록을 채우지 않는다', async () => {
    let resolveRecurrings
    recurringApi.getRecurrings.mockReturnValue(
      new Promise((resolve) => {
        resolveRecurrings = resolve
      }),
    )
    const payment = usePaymentStore()
    const pending = payment.fetchRecurringPayments()

    resetUserStores()

    resolveRecurrings({
      data: {
        result: [{ recurringId: 'old', itemName: '이전 정기결제', price: 1000, cycleDay: 1 }],
      },
    })
    await pending

    expect(payment.recurringPayments).toEqual([])
    expect(payment.hasFetchedRecurringPayments).toBe(false)
  })

  it('지갑 진행 중 출금 상태를 메모리에서 비운다', () => {
    const wallet = useWalletStore()
    wallet.wallet = { totalBalance: 5000 }
    wallet.pendingWithdrawal = { accountId: 'acc-a', amount: 1000 }

    resetUserStores()

    expect(wallet.wallet).toBeNull()
    expect(wallet.pendingWithdrawal).toBeNull()
  })
})
