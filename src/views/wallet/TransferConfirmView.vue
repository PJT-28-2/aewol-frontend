<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import PinAuthSheet from '@/components/common/PinAuthSheet.vue';
import { getBankMeta } from '@/utils/bankMeta';

const route = useRoute();
const router = useRouter();

const bankCode = computed(() => route.query.bankCode || '');
const accountNumber = computed(() => route.query.accountNumber || '');
const amount = computed(() => Number(route.query.amount) || 0);

const bankMeta = computed(() => (bankCode.value ? getBankMeta(bankCode.value) : null));

// TODO: 실명조회(예금주 확인) API 연동 전이라 더미 이름으로 표시
const depositorName = '홍길동';

const isInvalid = computed(
  () => !bankCode.value || !accountNumber.value || amount.value <= 0,
);

const memo = ref('');

function goToTransfer() {
  router.replace('/wallet/transfer');
}

// 송금 비밀번호 인증 바텀시트
const isPinSheetOpen = ref(false);

function handleSend() {
  if (isInvalid.value) return;
  isPinSheetOpen.value = true;
}

// TODO: 백엔드 송금 API 연동 후 실제 이체 처리로 교체
function handlePinComplete() {
  router.push({
    path: '/wallet/transfer/complete',
    query: {
      bankCode: bankCode.value,
      accountNumber: accountNumber.value,
      amount: amount.value,
      myAccountId: route.query.myAccountId,
    },
  });
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        보내기 전에 확인해주세요
      </h1>
    </header>

    <template v-if="isInvalid">
      <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-6)">
        송금 정보를 찾을 수 없어요. 송금하기 화면에서 다시 시도해주세요.
      </p>
      <AppButton
        variant="navy"
        size="lg"
        block
        @click="goToTransfer"
      >
        송금하기로 이동
      </AppButton>
    </template>

    <template v-else>
      <div
        class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-xl) p-(--space-4) mb-(--space-6)"
      >
        <BankBadge
          :bank-code="bankCode"
          :size="40"
        />
        <div class="flex-1">
          <p
            class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            {{ bankMeta.name }}
          </p>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            {{ accountNumber }} · {{ depositorName }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between mb-(--space-4)">
        <span class="text-(length:--font-md) text-(color:--color-slate-dark)">
          보낼 금액
        </span>
        <span
          class="text-(length:--font-xl) font-bold text-(color:--color-navy)"
        >
          {{ amount.toLocaleString() }}원
        </span>
      </div>

      <div class="border-t border-(--color-border) mb-(--space-6)" />

      <section class="mb-(--space-6)">
        <h2
          class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
        >
          메모 (선택)
        </h2>
        <input
          v-model="memo"
          type="text"
          placeholder="메모를 남겨보세요"
          class="w-full p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none"
        >
      </section>

      <AppButton
        variant="primary"
        size="lg"
        class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
        @click="handleSend"
      >
        {{ amount.toLocaleString() }}원 보내기
      </AppButton>
    </template>

    <!-- 송금 비밀번호 인증 바텀시트 -->
    <PinAuthSheet
      v-model="isPinSheetOpen"
      :description="`${amount.toLocaleString()}원을 안전하게 보내기 위해 확인해요`"
      @complete="handlePinComplete"
    />
  </div>
</template>
