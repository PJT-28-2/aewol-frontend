<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useAccountStore } from '@/stores/account';
import { formatWon, getBankMeta } from '@/utils/bankMeta';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();

const loadError = ref('');

// 실패와 "진짜 연동 계좌 없음"을 구분해서 보여줘요.
async function loadAccounts() {
  loadError.value = '';
  try {
    await accountStore.fetchAccounts();
  } catch {
    loadError.value = '계좌 목록을 불러오지 못했어요. 다시 시도해주세요';
  }
}

onMounted(() => {
  if (accountStore.accounts.length) return;
  loadAccounts();
});

const selectedAccount = computed(() => {
  const queryId = Number(route.query.accountId);
  return (
    accountStore.accounts.find((account) => account.accountId === queryId) ??
    accountStore.primaryAccount ??
    accountStore.accounts[0] ??
    null
  );
});

const selectedBankMeta = computed(() =>
  selectedAccount.value ? getBankMeta(selectedAccount.value.bankCode) : null,
);

const quickAmounts = [10000, 30000, 50000, 100000];

const amount = ref(Number(route.query.amount) || 0);

function addAmount(value) {
  amount.value += value;
}

function goToAccountSelect() {
  router.push({
    path: '/wallet/charge/account-select',
    query: {
      from: route.query.from,
      amount: amount.value,
      accountId: selectedAccount.value?.accountId,
    },
  });
}

function handleCharge() {
  if (!amount.value || !selectedAccount.value) return;
  // TODO: 백엔드 충전 API 연동 후 실제 잔액 반영으로 교체
  router.push({
    path: '/wallet/charge/complete',
    query: {
      from: route.query.from,
      amount: amount.value,
      accountId: selectedAccount.value.accountId,
    },
  });
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-app-bg) min-h-screen"
  >
    <header class="mb-(--space-5)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        충전하기
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        애월지갑에 충전할 금액을 입력해주세요
      </p>
    </header>

    <section
      class="flex items-center justify-center bg-(--color-surface) rounded-(--radius-xl) py-(--space-7) mb-(--space-4)"
    >
      <p
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        {{ amount.toLocaleString() }}원
      </p>
    </section>

    <div class="grid grid-cols-4 gap-(--space-2) mb-(--space-6)">
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
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-3)"
      >
        결제 수단
      </h2>

      <div
        v-if="accountStore.isLoading"
        class="py-(--space-4)"
      >
        <LoadingSpinner />
      </div>

      <div
        v-else-if="loadError"
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-center shadow-(--shadow-card)"
      >
        <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-3)">
          {{ loadError }}
        </p>
        <AppButton
          variant="primary"
          size="sm"
          @click="loadAccounts"
        >
          다시 시도
        </AppButton>
      </div>

      <button
        v-else-if="selectedAccount"
        type="button"
        class="w-full flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-icon) p-(--space-4)"
        @click="goToAccountSelect"
      >
        <BankBadge
          :bank-code="selectedAccount.bankCode"
          :size="40"
        />
        <div class="flex-1 text-left">
          <div class="flex items-baseline gap-1.5">
            <span class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
              {{ selectedBankMeta.name }}
            </span>
            <span class="text-(length:--font-sm) text-(color:--color-gray-500)">
              {{ selectedAccount.accountNumberMasked }}
            </span>
          </div>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            {{ formatWon(selectedAccount.balance) }}<span v-if="selectedAccount.isPrimary"> · 주계좌</span>
          </p>
        </div>
        <span
          class="text-(length:--font-xl) text-(color:--color-gray-400)"
        >&rsaquo;</span>
      </button>

      <p
        v-else
        class="text-(length:--font-sm) text-(color:--color-gray-500)"
      >
        연동된 계좌가 없어요
      </p>
    </section>

    <AppButton
      variant="primary"
      size="lg"
      :disabled="!amount || !selectedAccount"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
      @click="handleCharge"
    >
      충전하기
    </AppButton>
  </div>
</template>
