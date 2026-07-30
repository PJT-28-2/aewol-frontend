<script setup>
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { ENABLED_BANK_CODES } from '@/utils/mockData';
import BankBadge from '@/components/common/BankBadge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';

const router = useRouter();
const store = useAccountStore();

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
  router.push({ name: 'AccountAuthOneWon' });
}
</script>

<template>
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-(--space-5) pt-(--space-6) pb-(--space-8)">
    <button
      class="-ml-(--space-2) p-(--space-2) flex items-center justify-center mb-(--space-5)"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="20" color="var(--color-gray-700)" />
    </button>

    <header class="mb-7">
      <h1 class="text-(length:--font-2xl) font-(--font-bold) text-(color:--color-navy)">
        계좌 연동하기
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-(--space-1)">
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
      class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-6) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger) mb-(--space-3)">
        {{ loadError }}
      </p>
      <button
        class="px-(--space-5) py-(--space-2) rounded-(--radius-lg) bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-(--font-semibold)"
        @click="loadBanks"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else
      class="grid grid-cols-2 gap-(--space-3) mb-7"
    >
      <button
        v-for="bank in normalizedBanks"
        :key="bank.code"
        class="relative flex items-center gap-(--space-3) p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-left"
        :class="isEnabled(bank.code) ? '' : 'opacity-50'"
        :disabled="!isEnabled(bank.code)"
        @click="selectBank(bank.code)"
      >
        <BankBadge
          :bank-code="bank.code"
          :fallback-name="bank.name"
          :size="36"
        />
        <span class="font-(--font-semibold) text-(color:--color-navy) text-(length:--font-md)">{{ bank.name }}</span>
        <span
          v-if="!isEnabled(bank.code)"
          class="absolute top-2 right-2 px-(--space-2) py-0.5 rounded-(--radius-full) bg-(--color-gray-200) text-(length:--font-xs) text-(color:--color-gray-600)"
        >
          준비중
        </span>
      </button>
    </div>

    <div class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface)">
      <p class="text-(length:--font-sm) font-(--font-semibold) text-(color:--color-navy) mb-(--space-1)">
        계좌 데이터는 CODEF API를 통해 조회 전용으로 연동돼요
      </p>
      <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">
        실제 자금은 이동하지 않으며, 잔액 확인 목적에만 사용됩니다
      </p>
    </div>
  </div>
</template>