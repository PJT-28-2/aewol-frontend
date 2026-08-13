<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useAccountStore } from '@/stores/account';
import { useAccountsLoader } from '@/composables/useAccountsLoader';
import { getBankMeta } from '@/utils/bankMeta';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();

// 실패와 "진짜 연동 계좌 없음"을 구분해서 보여줘요.
// (예전엔 실패해도 에러를 삼키고 MOCK_ACCOUNTS로 조용히 폴백했어서
//  연동 실패가 화면에 전혀 안 보이는 문제가 있었어요.)
const { loadError, isLoadingAccounts, loadAccounts } = useAccountsLoader(() =>
  accountStore.fetchAccounts(),
);

onMounted(() => {
  if (accountStore.accounts.length) return;
  loadAccounts();
});

const pendingAccountId = ref(
  route.query.accountId ? String(route.query.accountId) : undefined,
);
const activeAccounts = computed(() =>
  accountStore.accounts.filter((account) => account.status !== 'INACTIVE'),
);

// route.query.accountId가 없을 때, 계좌 목록이 비동기로 로드된 뒤에도
// 주계좌를 기본 선택값으로 반영하기 위한 watch (accounts는 onMounted에서 채워짐)
watch(
  () => accountStore.accounts.length,
  () => {
    if (pendingAccountId.value != null) return;
    pendingAccountId.value =
      accountStore.primaryAccount?.accountId ?? activeAccounts.value[0]?.accountId;
  },
  { immediate: true },
);

function isSelected(account) {
  return String(account.accountId) === String(pendingAccountId.value);
}

function selectAccount(account) {
  pendingAccountId.value = account.accountId;
}

function confirmChange() {
  router.replace({
    path: '/wallet/transfer',
    query: { ...route.query, accountId: pendingAccountId.value },
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
        출금 계좌 선택
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        애월지갑의 돈을 받을 본인 계좌를 선택해주세요
      </p>
    </header>

    <div
      v-if="accountStore.isLoading"
      class="py-(--space-8)"
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
        :disabled="isLoadingAccounts"
        @click="loadAccounts"
      >
        다시 시도
      </AppButton>
    </div>

    <p
      v-else-if="!activeAccounts.length"
      class="text-(length:--font-sm) text-(color:--color-gray-500)"
    >
      연동된 계좌가 없어요
    </p>

    <ul
      v-else
      class="flex flex-col gap-(--space-3)"
    >
      <li
        v-for="account in activeAccounts"
        :key="account.accountId"
      >
        <button
          type="button"
          class="w-full flex items-center gap-(--space-3) bg-(--color-white) border rounded-(--radius-icon) p-(--space-4)"
          :class="
            isSelected(account)
              ? 'border-(--color-gold) border-2'
              : 'border-(--color-border)'
          "
          @click="selectAccount(account)"
        >
          <BankBadge
            :bank-code="account.bankCode"
            :size="40"
          />
          <div class="flex-1 text-left">
            <div class="flex items-baseline gap-1.5">
              <span class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
                {{ getBankMeta(account.bankCode).name }}
              </span>
              <span class="text-(length:--font-sm) text-(color:--color-gray-500)">
                {{ account.accountNumberMasked }}
              </span>
            </div>
            <p
              class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
            >
              연동됨<span v-if="account.isPrimary"> · 주계좌</span>
            </p>
          </div>
          <IconCheck
            v-if="isSelected(account)"
            size="18"
            color="var(--color-gold-dark)"
          />
        </button>
      </li>
    </ul>

    <AppButton
      variant="primary"
      size="lg"
      :disabled="!pendingAccountId"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
      @click="confirmChange"
    >
      변경하기
    </AppButton>
  </div>
</template>
