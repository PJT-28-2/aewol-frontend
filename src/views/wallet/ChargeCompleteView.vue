<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import petSuccess from '@/assets/images/pet-success.png';
import petNotFound from '@/assets/images/pet-not-found.png';
import { useAccountStore } from '@/stores/account';
import { getBankMeta } from '@/utils/bankMeta';
import { MOCK_ACCOUNTS } from '@/mocks/account';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();

const amount = computed(() => Number(route.query.amount) || 0);

const chargedAccount = computed(() => {
  const queryId = Number(route.query.accountId);
  return (
    accountStore.accounts.find(
      (account) => account.accountId === queryId,
    ) ??
    accountStore.primaryAccount ??
    accountStore.accounts[0] ??
    null
  );
});

const chargedBankMeta = computed(() =>
  chargedAccount.value
    ? getBankMeta(chargedAccount.value.bankCode)
    : null,
);

const isLoading = ref(true);
const showInvalidState = ref(false);

onMounted(async () => {
  if (!accountStore.accounts.length) {
    try {
      await accountStore.fetchAccounts();
    } catch {
      // 계좌 연동 API 연동 전이라 조회가 실패할 수 있어요. 결제 수단은 최소 하나 보이도록 폴백
    }
    if (!accountStore.accounts.length) {
      accountStore.accounts = structuredClone(MOCK_ACCOUNTS);
    }
  }
  if (amount.value <= 0 || !chargedAccount.value) {
    showInvalidState.value = true;
  }
  isLoading.value = false;
});

const completedAt = new Date();
const completedAtLabel = computed(() => {
  const year = completedAt.getFullYear();
  const month = String(completedAt.getMonth() + 1).padStart(
    2,
    '0',
  );
  const day = String(completedAt.getDate()).padStart(2, '0');
  const hour = completedAt.getHours();
  const minute = completedAt.getMinutes();
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${year}.${month}.${day} ${period} ${hour12}:${String(minute).padStart(2, '0')}`;
});

function confirmComplete() {
  router.replace(route.query.from === 'home' ? '/home' : '/wallet');
}

function goToWallet() {
  router.replace('/wallet');
}
</script>

<template>
  <div
    class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-(--space-6) pt-[calc(var(--header-height)+var(--space-4))] flex flex-col items-center text-center"
  >
    <LoadingSpinner v-if="isLoading" />

    <template v-else-if="showInvalidState">
      <img
        :src="petNotFound"
        alt=""
        class="w-32 h-auto mb-(--space-4)"
      >
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        충전 정보를 찾을 수 없어요
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)"
      >
        펫지갑에서 충전을 다시 시도해주세요
      </p>
      <AppButton
        variant="navy"
        size="lg"
        block
        @click="goToWallet"
      >
        펫지갑으로 이동
      </AppButton>
    </template>

    <template v-else-if="chargedAccount">
      <img
        :src="petSuccess"
        alt=""
        class="w-32 h-auto mb-(--space-4)"
      >
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        충전을 완료했어요!
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)"
      >
        {{ chargedBankMeta.name }} 계좌에서
        {{ amount.toLocaleString() }}원을 충전했어요
      </p>

      <div
        class="w-full flex flex-col gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-8)"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >충전 금액</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ amount.toLocaleString() }}원</span>
        </div>
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >결제 수단</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ chargedBankMeta.name }}
            {{ chargedAccount.accountNumberMasked }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >충전 시간</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ completedAtLabel }}</span>
        </div>
      </div>

      <AppButton
        variant="navy"
        size="lg"
        block
        @click="confirmComplete"
      >
        확인
      </AppButton>
    </template>
  </div>
</template>
