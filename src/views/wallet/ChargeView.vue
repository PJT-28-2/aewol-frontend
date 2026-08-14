<script setup>
import { computed, ref } from 'vue'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useWalletStore } from '@/stores/wallet'
import { getTossCustomerKey } from '@/utils/tossPayments'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const amount = ref(Number(route.query.amount) || 0)
const isSubmitting = ref(false)
const requestError = ref('')
const quickAmounts = [10000, 30000, 50000, 100000]

const amountInput = computed({
  get: () => (amount.value > 0 ? amount.value.toLocaleString('ko-KR') : ''),
  set: (value) => {
    amount.value = Number(String(value).replace(/\D/g, '').slice(0, 13)) || 0
  },
})

const canCharge = computed(() => amount.value > 0 && !isSubmitting.value)

function addAmount(value) {
  amount.value = Math.min(amount.value + value, 9_999_999_999_999)
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

    await payment.requestPayment({
      method: 'CARD',
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
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)]">
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        충전하기
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        카드·간편결제로 애월지갑을 충전해요
      </p>
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
        TossPayments로 안전하게 결제해요
      </h2>
      <p class="mt-(--space-2) text-(length:--font-sm) leading-relaxed text-(color:--color-slate-muted)">
        결제창에서 카드 또는 간편결제를 선택할 수 있어요. 결제가 승인된 뒤 애월지갑 잔액에 반영돼요.
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
  </div>
</template>
