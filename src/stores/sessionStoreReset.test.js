import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetUserSessionStores } from './sessionStoreReset'
import { useAccountStore } from './account'
import { useDonationStore } from './donation'
import { useInsuranceStore } from './insurance'
import { usePaymentStore } from './payment'
import { usePetStore } from './pet'
import { useShareStore } from './share'
import { useShareDiaryStore } from './shareDiary'
import { useWalletStore } from './wallet'

describe('resetUserSessionStores', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('removes account-specific data and restores fetch guards after session termination', () => {
    const accountStore = useAccountStore()
    const donationStore = useDonationStore()
    const paymentStore = usePaymentStore()

    accountStore.accounts = [{ accountId: 1, maskedAccountNumber: '***1234' }]
    accountStore.linking.bankCode = '004'
    accountStore.linking.accountNumber = '1234567890'
    accountStore.pendingUnlinkAccount = { accountId: 1 }
    accountStore.lastLinkedAccountId = 1
    donationStore.balance = 50000
    donationStore.campaigns = [{ id: 1, title: 'A campaign' }]
    donationStore.isInitialized = true
    paymentStore.recurringPayments = [{ id: 1, merchantName: 'A merchant' }]
    paymentStore.hasFetchedRecurringPayments = true

    resetUserSessionStores()

    expect(accountStore.accounts).toEqual([])
    expect(accountStore.linking.bankCode).toBeNull()
    expect(accountStore.linking.accountNumber).toBe('')
    expect(accountStore.pendingUnlinkAccount).toBeNull()
    expect(accountStore.lastLinkedAccountId).toBeNull()
    expect(donationStore.balance).toBe(0)
    expect(donationStore.campaigns).toEqual([])
    expect(donationStore.isInitialized).toBe(false)
    expect(paymentStore.recurringPayments).toEqual([])
    expect(paymentStore.hasFetchedRecurringPayments).toBe(false)
  })

  it('removes shared-care, insurance, wallet, and diary data from the previous user', () => {
    localStorage.setItem('representativePetId', '1')
    const shareStore = useShareStore()
    const diaryStore = useShareDiaryStore()
    const insuranceStore = useInsuranceStore()
    const walletStore = useWalletStore()
    const petStore = usePetStore()

    shareStore.pets = [{ id: 1, name: 'A pet' }]
    shareStore.members = [{ id: 1, name: 'A member' }]
    shareStore.contributions = [{ id: 1, amount: 10000 }]
    diaryStore.petId = '1'
    diaryStore.diaries = [{ diaryId: 1, content: 'A diary' }]
    insuranceStore.claimDraft = { diagnosis: 'A diagnosis', accountInfo: 'A account' }
    insuranceStore.claims = [{ claimId: 1 }]
    walletStore.wallet = { totalBalance: 100000 }
    petStore.pets = [{ id: '1', name: 'A pet' }]

    resetUserSessionStores()

    expect(shareStore.pets).toEqual([])
    expect(shareStore.members).toEqual([])
    expect(shareStore.contributions).toEqual([])
    expect(diaryStore.petId).toBe('')
    expect(diaryStore.diaries).toEqual([])
    expect(insuranceStore.claimDraft).toBeNull()
    expect(insuranceStore.claims).toEqual([])
    expect(walletStore.wallet).toBeNull()
    expect(petStore.pets).toEqual([])
    expect(petStore.representativePetId).toBeNull()
    expect(localStorage.getItem('representativePetId')).toBeNull()
  })
})
