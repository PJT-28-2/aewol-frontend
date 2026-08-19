<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import BankBadge from '@/components/common/BankBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAccountStore } from '@/stores/account'
import { useWalletStore } from '@/stores/wallet'
import { getBankMeta } from '@/utils/bankMeta'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const walletStore = useWalletStore()

const isLoading = ref(true)
const loadError = ref('')
let isLoadRequestInFlight = false

async function loadTransferData() {
  if (isLoadRequestInFlight) return

  isLoadRequestInFlight = true
  isLoading.value = true
  loadError.value = ''

  const shouldLoadAccounts = !accountStore.accounts.length
  const [walletResult, accountResult] = await Promise.allSettled([
    walletStore.fetchWallet(),
    shouldLoadAccounts ? accountStore.fetchAccounts() : Promise.resolve(),
  ])

  const walletFailed = walletResult.status === 'rejected'
  const accountsFailed = accountResult.status === 'rejected'

  if (walletFailed && accountsFailed) {
    loadError.value = '지갑과 계좌 정보를 불러오지 못했어요.'
  } else if (walletFailed) {
    loadError.value = '지갑 정보를 불러오지 못했어요.'
  } else if (accountsFailed) {
    loadError.value = '계좌 목록을 불러오지 못했어요.'
  }

  isLoading.value = false
  isLoadRequestInFlight = false
}

onMounted(loadTransferData)

const amount = ref(Number(route.query.amount) || 0)
const amountInput = computed({
  get: () => (amount.value > 0 ? amount.value.toLocaleString('ko-KR') : ''),
  set: (value) => {
    amount.value = Number(String(value).replace(/\D/g, '').slice(0, 13)) || 0
  },
})
const quickAmounts = [10000, 30000, 50000, 100000]

function addAmount(value) {
  amount.value += value
}

const walletBalance = computed(() => walletStore.wallet?.totalBalance ?? 0)
const activeAccounts = computed(() =>
  accountStore.accounts.filter((account) => account.status !== 'INACTIVE'),
)
const selectedAccount = computed(() => {
  const queryId = String(route.query.accountId ?? '')
  return activeAccounts.value.find(
    (account) => String(account.accountId) === queryId,
  ) ?? activeAccounts.value.find((account) => account.isPrimary)
    ?? activeAccounts.value[0]
    ?? null
})
const selectedBankName = computed(() =>
  selectedAccount.value?.bankName
  ?? (selectedAccount.value ? getBankMeta(selectedAccount.value.bankCode).name : ''),
)
const isInsufficientBalance = computed(
  () => amount.value > walletBalance.value,
)
const canProceed = computed(
  () => !!selectedAccount.value && amount.value > 0 && !isInsufficientBalance.value,
)

function currentQuery() {
  return {
    accountId: selectedAccount.value?.accountId,
    amount: amount.value || undefined,
  }
}

function goToAccountSelect() {
  router.push({
    path: '/wallet/transfer/account-select',
    query: currentQuery(),
  })
}

function handleNext() {
  if (!canProceed.value) return
  router.push({
    path: '/wallet/transfer/confirm',
    query: currentQuery(),
  })
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)]">
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        얼마를 출금할까요?
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        애월지갑에서 내 연결 계좌로 출금해요
      </p>
    </header>

    <div
      v-if="isLoading"
      class="flex justify-center py-(--space-9)"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-center shadow-(--shadow-card)"
      role="alert"
    >
      <p class="mb-(--space-3) text-(length:--font-sm) text-(color:--color-danger-strong)">
        {{ loadError }} 다시 시도해주세요.
      </p>
      <AppButton
        variant="primary"
        size="sm"
        :disabled="isLoading"
        @click="loadTransferData"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else>
      <section class="mb-(--space-6) rounded-(--radius-xl) bg-(--color-navy) p-(--space-5) text-(color:--color-white)">
        <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
          출금 가능한 애월지갑 잔액
        </p>
        <p class="mt-(--space-2) text-(length:--font-2xl) font-bold">
          {{ walletBalance.toLocaleString() }}원
        </p>
      </section>

      <section class="mb-(--space-5)">
        <label
          for="withdraw-amount"
          class="mb-(--space-2) block text-(length:--font-md) font-semibold text-(color:--color-navy)"
        >출금 금액</label>
        <div class="relative">
          <input
            id="withdraw-amount"
            v-model="amountInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 pr-10 text-right text-(length:--font-xl) font-bold text-(color:--color-navy) outline-none"
          >
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-(length:--font-md) text-(color:--color-slate-muted)">원</span>
        </div>
        <p
          v-if="isInsufficientBalance"
          class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-danger-strong)"
          role="alert"
        >
          애월지갑 잔액이 부족해요
        </p>
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

      <section class="mb-(--space-6)">
        <h2 class="mb-(--space-3) text-(length:--font-md) font-semibold text-(color:--color-navy)">
          출금받을 내 계좌
        </h2>
        <button
          v-if="selectedAccount"
          type="button"
          class="flex w-full items-center gap-(--space-3) rounded-(--radius-icon) border border-(--color-border) bg-(--color-white) p-(--space-4)"
          @click="goToAccountSelect"
        >
          <BankBadge
            :bank-code="selectedAccount.bankCode"
            :size="40"
          />
          <div class="flex-1 text-left">
            <p class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
              {{ selectedBankName }}
            </p>
            <p class="mt-(--space-1) text-(length:--font-sm) text-(color:--color-slate-muted)">
              {{ selectedAccount.accountNumberMasked }}<span v-if="selectedAccount.isPrimary"> · 주계좌</span>
            </p>
          </div>
          <span class="text-(length:--font-xl) text-(color:--color-gray-400)">&rsaquo;</span>
        </button>
        <p
          v-else
          class="text-(length:--font-sm) text-(color:--color-gray-500)"
        >
          출금받을 연결 계좌가 없어요
        </p>
      </section>

      <AppButton
        variant="primary"
        size="lg"
        :disabled="!canProceed"
        class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
        @click="handleNext"
      >
        다음
      </AppButton>
    </template>
  </div>
</template>
