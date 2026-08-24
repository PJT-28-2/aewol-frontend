import { useAccountStore } from '@/stores/account'
import { useAdminDiaryReportStore } from '@/stores/adminDiaryReport'
import { useAdminInquiryStore } from '@/stores/adminInquiry'
import { useCertificateStore } from '@/stores/certificate'
import { useDashboardStore } from '@/stores/dashboard'
import { useDonationStore } from '@/stores/donation'
import { useExploreStore } from '@/stores/explore'
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase'
import { useInsuranceStore } from '@/stores/insurance'
import { useNotificationStore } from '@/stores/notification'
import { usePaymentStore } from '@/stores/payment'
import { usePetStore } from '@/stores/pet'
import { useShareStore } from '@/stores/share'
import { useShareDiaryStore } from '@/stores/shareDiary'
import { useSupportStore } from '@/stores/support'
import { useSupportProgramsStore } from '@/stores/supportPrograms'
import { useTransactionStore } from '@/stores/transaction'
import { useWalletStore } from '@/stores/wallet'

const userSessionStores = [
  useAdminDiaryReportStore,
  useAdminInquiryStore,
  useCertificateStore,
  useDashboardStore,
  useDonationStore,
  useExploreStore,
  useGroupPurchaseCreateStore,
  useInsuranceStore,
  useNotificationStore,
  usePaymentStore,
  usePetStore,
  useShareStore,
  useShareDiaryStore,
  useSupportStore,
  useSupportProgramsStore,
  useTransactionStore,
  useWalletStore,
]

export function resetUserSessionStores() {
  const accountStore = useAccountStore()
  accountStore.resetLinkingState()
  accountStore.$reset()
  localStorage.removeItem('representativePetId')
  userSessionStores.forEach((useStore) => useStore().$reset())
}
