<script setup>
import { computed, onMounted, ref } from 'vue'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useWalletStore } from '@/stores/wallet'
import { useAccountStore } from '@/stores/account'
import { getTossCustomerKey } from '@/utils/tossPayments'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()
const accountStore = useAccountStore()

const amount = ref(Number(route.query.amount) || 0)
const isSubmitting = ref(false)
const requestError = ref('')
const showAccountLinkModal = ref(false)
const quickAmounts = [10000, 30000, 50000, 100000]

onMounted(async () => {
  try {
    await accountStore.fetchAccounts()
    if (accountStore.accounts.length === 0) {
      showAccountLinkModal.value = true
    }
  } catch {
    requestError.value = '계좌 정보를 확인하지 못했어요. 다시 시도해주세요.'
  }
})

const amountInput = computed({
  get: () => (amount.value > 0 ? amount.value.toLocaleString('ko-KR') : ''),
  set: (value) => {
    amount.value = Number(String(value).replace(/\D/g, '').slice(0, 13)) || 0
  },
})

const canCharge = computed(() =>
  accountStore.accounts.length > 0 && amount.value > 0 && !isSubmitting.value,
)

function addAmount(value) {
  amount.value = Math.min(amount.value + value, 9_999_999_999_999)
}

function goToAccountLink() {
  router.push({ path: '/account/link', query: { next: '/wallet/charge' } })
}

function goToWallet() {
  router.replace('/wallet')
}

function callbackUrl(name) {
  return new URL(router.resolve({ name }).href, window.location.origin).toString()
}

async function handleCharge() {
  if (!canCharge.value) return

  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim()
  if (!clientKey || clientKey.includes('_sk_')) {
    requestError.value = 'TossPayments 클라이언트 키가 설정되지 않았어요.'
    return
  }

  isSubmitting.value = true
  requestError.value = ''
  try {
    const order = await walletStore.prepareTossCharge({
      amount: amount.value,
      returnTo: route.query.from === 'home' ? 'home' : 'wallet',
    })
    const tossPayments = await loadTossPayments(clientKey)
    const payment = tossPayments.payment({ customerKey: getTossCustomerKey() })

    // 충전은 계좌이체(퀵계좌이체)만 허용한다. method를 지정하지 않거나 'CARD'를 주면
    // 결제창에서 카드·간편결제 탭이 함께 열려서 사용자가 카드로 충전할 수 있게 된다.
    // 'TRANSFER'는 계좌이체 결제창만 여는 값이다.
    // 가상계좌('VIRTUAL_ACCOUNT')는 쓰지 않는다 — 입금 전까지 confirm 응답이
    // WAITING_FOR_DEPOSIT이라 TossPaymentsClient가 INDETERMINATE로 떨어뜨리고
    // (TossPaymentsClient.java:158-163) 잔액이 즉시 반영되지 않는다. 웹훅 수신이
    // 없는 현재 구조에서는 계좌이체만이 즉시 승인되는 계좌 기반 수단이다.
    await payment.requestPayment({
      method: 'TRANSFER',
      amount: { currency: 'KRW', value: order.amount },
      orderId: order.orderId,
      orderName: '애월지갑 충전',
      successUrl: callbackUrl('TossChargeSuccess'),
      failUrl: callbackUrl('TossChargeFail'),
    })
  } catch (error) {
    walletStore.clearPendingTossCharge()
    requestError.value = error.response?.data?.message
      || (error.code === 'USER_CANCEL' ? '결제가 취소되었어요.' : '결제창을 열지 못했어요. 다시 시도해주세요.')
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[96px]">
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        충전하기
      </h1>
    </header>

    <section class="mb-(--space-5)">
      <label
        for="charge-amount"
        class="mb-(--space-2) block text-(length:--font-md) font-semibold text-(color:--color-navy)"
      >충전 금액</label>
      <div class="relative">
        <input
          id="charge-amount"
          v-model="amountInput"
          type="text"
          inputmode="numeric"
          placeholder="0"
          class="w-full rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 pr-10 text-right text-(length:--font-xl) font-bold text-(color:--color-navy) outline-none"
        >
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-(length:--font-md) text-(color:--color-slate-muted)">원</span>
      </div>
    </section>

    <div class="mb-(--space-6) grid grid-cols-4 gap-(--space-2)">
      <button
        v-for="value in quickAmounts"
        :key="value"
        type="button"
        class="h-[36px] rounded-[10px] border border-(--color-border) text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
        @click="addAmount(value)"
      >
        +{{ value / 10000 }}만원
      </button>
    </div>

    <section class="rounded-(--radius-2xl) bg-(--color-white) p-(--space-5)">
      <h2 class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
        TossPayments 계좌이체로 안전하게 충전해요
      </h2>
      <p class="mt-(--space-2) text-(length:--font-sm) leading-relaxed text-(color:--color-slate-muted)">
        계좌이체로만 충전할 수 있어요. 결제창에서 출금할 계좌를 선택하고 이체가 승인되면 애월지갑 잔액에 반영돼요.
      </p>
    </section>

    <p
      v-if="requestError"
      class="mt-(--space-4) rounded-(--radius-xl) bg-(--color-danger-soft) p-(--space-3) text-(length:--font-sm) text-(color:--color-danger-strong)"
      role="alert"
    >
      {{ requestError }}
    </p>

    <AppButton
      variant="primary"
      size="lg"
      :disabled="!canCharge"
      :loading="isSubmitting"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
      @click="handleCharge"
    >
      {{ amount > 0 ? `${amount.toLocaleString()}원 충전하기` : '충전하기' }}
    </AppButton>

    <AppModal
      v-model="showAccountLinkModal"
      title="연결된 계좌가 없어요"
      :divider="false"
      :show-close="false"
      center-title
    >
      <p class="text-center text-(length:--font-sm) leading-relaxed text-(color:--color-slate-muted)">
        애월지갑을 충전하려면<br>먼저 사용할 계좌를 연결해주세요.
      </p>
      <template #footer>
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1"
          @click="goToWallet"
        >
          나중에
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          class="flex-1"
          @click="goToAccountLink"
        >
          계좌 연결하기
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
