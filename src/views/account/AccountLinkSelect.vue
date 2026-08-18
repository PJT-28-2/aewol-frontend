<script setup>
import { onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { ENABLED_BANK_CODES } from '@/mocks/account';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const route = useRoute();
const store = useAccountStore();
const nextQuery = computed(() => route.query.next === '/wallet/charge' ? { next: '/wallet/charge' } : {});

const loadError = ref('');

async function loadBanks() {
  loadError.value = '';
  try {
    await store.fetchBanks();
  } catch {
    loadError.value = '은행 목록을 불러오지 못했어요. 다시 시도해주세요';
  }
}

onMounted(() => {
  loadBanks();
});

// 실제 GET /api/banks 응답 필드명이 bankCode/bankName이 아닐 수도 있어서
// 흔히 쓰는 변형(code, id, name, bankNm 등)까지 방어적으로 매핑해요.
const normalizedBanks = computed(() =>
  store.banks.map((bank) => ({
    code: bank.bankCode ?? bank.code ?? bank.bank_code ?? bank.id ?? bank.bankId ?? '',
    name: bank.bankName ?? bank.name ?? bank.bank_name ?? bank.bankNm ?? '이름 없음',
  })),
);

function isEnabled(bankCode) {
  return ENABLED_BANK_CODES.includes(bankCode);
}

function selectBank(bankCode) {
  if (!isEnabled(bankCode)) return;
  store.selectBankToLink(bankCode);
  router.push({ name: 'AccountAuthOneWon', query: nextQuery.value });
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-(--space-8)">
    <header class="mb-7">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        계좌 연동하기
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
        연동할 은행을 선택해주세요
      </p>
    </header>

    <div
      v-if="store.isLoading"
      class="py-(--space-8) mb-(--space-6)"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="loadError"
      class="mb-(--space-6) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-center shadow-(--shadow-card)"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-3)">
        {{ loadError }}
      </p>
      <AppButton
        variant="primary"
        size="sm"
        @click="loadBanks"
      >
        다시 시도
      </AppButton>
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-(--space-3) mb-7"
    >
      <button
        v-for="bank in normalizedBanks"
        :key="bank.code"
        class="relative flex items-start gap-(--space-3) py-(--space-4) pr-(--space-4) pl-(--space-5) rounded-(--radius-xl) bg-(--color-white) border border-(--color-border) text-left overflow-hidden"
        :class="isEnabled(bank.code) ? '' : 'pointer-events-none cursor-not-allowed'"
        :disabled="!isEnabled(bank.code)"
        @click="selectBank(bank.code)"
      >
        <div
          class="flex items-start gap-(--space-3)"
          :class="isEnabled(bank.code) ? '' : 'opacity-40'"
        >
          <BankBadge
            :bank-code="bank.code"
            :fallback-name="bank.name"
            :size="36"
          />
          <span class="self-center font-semibold text-(color:--color-navy) text-(length:--font-md)">{{ bank.name }}</span>
        </div>
        <div
          v-if="!isEnabled(bank.code)"
          class="absolute inset-0 bg-[color-mix(in_srgb,var(--color-white)_70%,transparent)]"
        />
      </button>
    </div>

    <div class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4)">
      <p class="text-(length:--font-sm) font-(--font-semibold) text-(color:--color-navy) mb-(--space-1)">
        계좌 데이터는 CODEF API를 통해 조회 전용으로 연동돼요
      </p>
      <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">
        실제 자금은 이동하지 않으며, 잔액 확인 목적에만 사용됩니다
      </p>
    </div>
  </div>
</template>
