<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import { useAccountStore } from '@/stores/account';
import { formatWon, getBankMeta } from '@/utils/bankMeta';
import { MOCK_ACCOUNTS } from '@/utils/mockData';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();

onMounted(async () => {
  if (accountStore.accounts.length) return;
  try {
    await accountStore.fetchAccounts();
  } catch {
    // 계좌 연동 API 연동 전이라 조회가 실패할 수 있어요. 내 계좌는 최소 하나 보이도록 폴백
  }
  if (!accountStore.accounts.length) {
    accountStore.accounts = structuredClone(MOCK_ACCOUNTS);
  }
});

const pendingAccountId = ref(Number(route.query.myAccountId) || undefined);

// route.query.myAccountId가 없을 때, 계좌 목록이 비동기로 로드된 뒤에도
// 주계좌를 기본 선택값으로 반영하기 위한 watch (accounts는 onMounted에서 채워짐)
watch(
  () => accountStore.accounts.length,
  () => {
    if (pendingAccountId.value != null) return;
    pendingAccountId.value =
      accountStore.primaryAccount?.accountId ?? accountStore.accounts[0]?.accountId;
  },
  { immediate: true },
);

function isSelected(account) {
  return account.accountId === pendingAccountId.value;
}

function selectAccount(account) {
  pendingAccountId.value = account.accountId;
}

function confirmChange() {
  router.replace({
    path: '/wallet/transfer',
    query: { ...route.query, myAccountId: pendingAccountId.value },
  });
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen"
  >
    <header class="mb-(--space-5)">
      <button
        type="button"
        aria-label="뒤로 가기"
        class="inline-flex mb-(--space-3) text-(color:--color-navy)"
        @click="router.back()"
      >
        <IconArrowLeft size="24" />
      </button>
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        내 계좌 선택
      </h1>
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        송금에 사용할 계좌를 선택해주세요
      </p>
    </header>

    <p
      v-if="!accountStore.accounts.length"
      class="text-(length:--font-sm) text-(color:--color-gray-500)"
    >
      연동된 계좌가 없어요
    </p>

    <ul
      v-else
      class="flex flex-col gap-(--space-3)"
    >
      <li
        v-for="account in accountStore.accounts"
        :key="account.accountId"
      >
        <button
          type="button"
          class="w-full flex items-center gap-(--space-3) bg-(--color-white) border rounded-[14px] p-(--space-4)"
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
              {{ formatWon(account.balance) }}<span v-if="account.isPrimary"> · 주계좌</span>
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
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
      @click="confirmChange"
    >
      변경하기
    </AppButton>
  </div>
</template>
