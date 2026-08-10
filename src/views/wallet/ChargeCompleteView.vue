<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';
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
    v-if="isLoading"
    class="grid min-h-[60svh] place-items-center"
  >
    <LoadingSpinner />
  </div>

  <CompletionPageLayout
    v-else-if="showInvalidState"
    title="충전 정보를 찾을 수 없어요"
    description="애월지갑에서 충전을 다시 시도해주세요"
    variant="warning"
  >
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="goToWallet"
      >
        애월지갑으로 이동
      </AppButton>
    </template>
  </CompletionPageLayout>

  <CompletionPageLayout
    v-else-if="chargedAccount"
    title="충전 완료"
    :description="`${chargedBankMeta.name} 계좌에서 ${amount.toLocaleString()}원을 충전했어요`"
  >
    <div class="mt-(--space-6) flex w-full flex-col gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)">
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
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="confirmComplete"
      >
        지갑으로
      </AppButton>
    </template>
  </CompletionPageLayout>
</template>
