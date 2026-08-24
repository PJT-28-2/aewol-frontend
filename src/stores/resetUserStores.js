import { getActivePinia } from 'pinia'
import { bumpSessionEpoch } from '@/utils/sessionEpoch'
import { useAccountStore } from '@/stores/account'
import { useCertificateStore } from '@/stores/certificate'
import { useDashboardStore } from '@/stores/dashboard'
import { useDonationStore } from '@/stores/donation'
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase'
import { useInsuranceStore } from '@/stores/insurance'
import { useMemberStore } from '@/stores/member'
import { useNotificationStore } from '@/stores/notification'
import { usePaymentStore } from '@/stores/payment'
import { usePetStore } from '@/stores/pet'
import { useShareStore } from '@/stores/share'
import { useShareDiaryStore } from '@/stores/shareDiary'
import { useSupportStore } from '@/stores/support'
import { useTransactionStore } from '@/stores/transaction'
import { useWalletStore } from '@/stores/wallet'

/**
 * 로그아웃·세션 만료 때 계정에 묶인 Pinia 상태를 비운다.
 *
 * <p>$reset만으로는 안 되는 값이 있다. pet의 대표 반려동물, account의 PIN 여부,
 * wallet의 출금/충전 진행 값은 스토어를 처음 만들 때 localStorage/sessionStorage를
 * 읽어 초기값으로 고정된다. 그래서 저장소를 지운 뒤에도 $reset이면 이전 계정 값이 돌아온다.
 */
export function resetUserStores() {
  bumpSessionEpoch()
  if (!getActivePinia()) return

  useMemberStore().clearProfile()
  useAccountStore().resetForLogout()
  usePetStore().resetForLogout()
  useWalletStore().resetForLogout()
  useDonationStore().$reset()
  usePaymentStore().$reset()
  useTransactionStore().$reset()
  useDashboardStore().$reset()
  useNotificationStore().$reset()
  useShareStore().$reset()
  useShareDiaryStore().$reset()
  useInsuranceStore().$reset()
  useCertificateStore().$reset()
  useSupportStore().$reset()
  useGroupPurchaseCreateStore().reset()
}
