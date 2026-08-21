<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import BankBadge from '@/components/common/BankBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PinAuthSheet from '@/components/common/PinAuthSheet.vue'
import { useAccountsLoader } from '@/composables/useAccountsLoader'
import { useAccountStore } from '@/stores/account'
import { useTransactionStore } from '@/stores/transaction'
import { useWalletStore } from '@/stores/wallet'
import { getBankMeta } from '@/utils/bankMeta'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()
const walletStore = useWalletStore()

const { loadError, isLoadingAccounts, loadAccounts } = useAccountsLoader(() =>
  accountStore.fetchAccounts(),
)

onMounted(() => {
  if (accountStore.accounts.length) return
  loadAccounts()
})

const accountId = computed(() => String(route.query.accountId ?? ''))
const amount = computed(() => Number(route.query.amount) || 0)
const account = computed(() => accountStore.accounts.find(
  (item) => String(item.accountId) === accountId.value && item.status !== 'INACTIVE',
) ?? null)
const bankName = computed(() =>
  account.value?.bankName
  ?? (account.value ? getBankMeta(account.value.bankCode).name : ''),
)
const isInvalid = computed(
  () => !accountId.value || amount.value <= 0 || !account.value,
)

const memo = ref('')
const isPinSheetOpen = ref(false)
const pinError = ref('')
const requestError = ref('')
const isSubmitting = ref(false)

function goToTransfer() {
  router.replace('/wallet/transfer')
}

function handleSend() {
  if (isInvalid.value || isSubmitting.value) return
  pinError.value = ''
  requestError.value = ''
  isPinSheetOpen.value = true
}

async function handlePinComplete(password) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  pinError.value = ''
  requestError.value = ''

  try {
    const verified = await walletStore.verifySimplePassword(password)
    if (!verified) {
      pinError.value = '간편 비밀번호가 일치하지 않아요.'
      isPinSheetOpen.value = true
      return
    }

    const result = await walletStore.withdraw({
      accountId: accountId.value,
      amount: amount.value,
      memo: memo.value,
      password,
    })

    await transactionStore.fetchRecentTransactions({ limit: 20 }).catch(() => {})
    await router.replace({
      path: '/wallet/transfer/complete',
      query: {
        transactionId: result.transactionId,
        accountId: result.accountId,
        bankName: result.bankName,
        accountNumberMasked: result.accountNumberMasked,
        amount: amount.value,
        withdrawnAt: result.withdrawnAt,
      },
    })
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.message
    if (status === 429) {
      requestError.value = message || '간편 비밀번호 입력이 잠겼어요. 잠시 후 다시 시도해주세요.'
    } else if (message?.includes('비밀번호')) {
      pinError.value = message
      isPinSheetOpen.value = true
    } else {
      requestError.value = message || '출금을 완료하지 못했어요. 다시 시도해주세요.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[96px]">
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        출금 전에 확인해주세요
      </h1>
    </header>

    <div
      v-if="isLoadingAccounts"
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
        {{ loadError }}
      </p>
      <AppButton
        variant="primary"
        size="sm"
        :disabled="isLoadingAccounts"
        @click="loadAccounts"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else-if="isInvalid">
      <p class="mb-(--space-6) text-(length:--font-sm) text-(color:--color-gray-500)">
        출금 정보를 찾을 수 없어요. 애월지갑에서 다시 시도해주세요.
      </p>
      <AppButton
        variant="navy"
        size="lg"
        block
        @click="goToTransfer"
      >
        출금 화면으로 이동
      </AppButton>
    </template>

    <template v-else>
      <div class="mb-(--space-6) flex items-center gap-(--space-3) rounded-(--radius-xl) bg-(--color-surface) p-(--space-4)">
        <BankBadge
          :bank-code="account.bankCode"
          :size="40"
        />
        <div class="flex-1">
          <p class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
            {{ bankName }}
          </p>
          <p class="mt-(--space-1) text-(length:--font-sm) text-(color:--color-slate-muted)">
            {{ account.accountNumberMasked }}<span v-if="account.isPrimary"> · 주계좌</span>
          </p>
        </div>
      </div>

      <div class="mb-(--space-4) flex items-center justify-between">
        <span class="text-(length:--font-md) text-(color:--color-slate-dark)">출금 금액</span>
        <span class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
          {{ amount.toLocaleString() }}원
        </span>
      </div>

      <div class="mb-(--space-6) border-t border-(--color-border)" />

      <section class="mb-(--space-6)">
        <label
          for="withdraw-memo"
          class="mb-(--space-2) block text-(length:--font-md) font-semibold text-(color:--color-navy)"
        >메모 (선택)</label>
        <input
          id="withdraw-memo"
          v-model="memo"
          type="text"
          maxlength="200"
          placeholder="메모를 남겨보세요"
          class="w-full rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 text-(length:--font-md) text-(color:--color-navy) outline-none"
        >
      </section>

      <p
        v-if="requestError"
        class="mb-(--space-4) rounded-(--radius-xl) bg-(--color-danger-soft) p-(--space-3) text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ requestError }}
      </p>

      <AppButton
        variant="primary"
        size="lg"
        :loading="isSubmitting"
        class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
        @click="handleSend"
      >
        {{ amount.toLocaleString() }}원 출금하기
      </AppButton>
    </template>

    <PinAuthSheet
      v-model="isPinSheetOpen"
      :description="`${amount.toLocaleString()}원을 안전하게 출금하기 위해 확인해요`"
      :error="pinError"
      @complete="handlePinComplete"
    />
  </div>
</template>
