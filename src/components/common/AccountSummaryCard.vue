<script setup>
import { computed } from 'vue';
import { getBankMeta } from '@/utils/bankMeta';
import BankBadge from '@/components/common/BankBadge.vue';

// 연동된 외부 은행 계좌의 실제 잔액은 이 앱이 알 방법이 없어요(CODEF 실시간 조회 제거,
// 2026-08-06) — 실제 돈은 애월 내부 지갑(wallet) 잔액으로만 보여줘요. 그래서 이 카드는
// 금액 대신 "연동됨" 상태만 표시해요.
const props = defineProps({
  bankCode: { type: String, required: true },
  // 계좌 목록 항목에서만 노출 (해제확인/완료 요약 카드는 안 보여줌)
  accountNumberMasked: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  badgeSize: { type: Number, default: 40 },
  // 계좌 목록 항목만 테두리가 있고, 해제확인/완료 카드는 배경색만 있음
  bordered: { type: Boolean, default: false },
});

const bankMeta = computed(() => getBankMeta(props.bankCode));
</script>

<template>
  <div
    class="flex items-center gap-(--space-3) p-(--space-4) text-left"
    :class="
      bordered
        ? 'bg-(--color-white) border border-(--color-border) rounded-(--radius-icon)'
        : 'bg-(--color-surface) rounded-(--radius-xl)'
    "
  >
    <BankBadge
      :bank-code="bankCode"
      :size="badgeSize"
    />
    <div class="flex-1">
      <div class="flex items-baseline gap-1.5">
        <span class="font-(--font-bold) text-(color:--color-navy) text-(length:--font-base)">{{ bankMeta.name }}</span>
        <span
          v-if="accountNumberMasked"
          class="text-(length:--font-sm) text-(color:--color-gray-500)"
        >
          {{ accountNumberMasked }}
        </span>
      </div>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mt-(--space-1)">
        연동됨<span v-if="isPrimary"> · 주계좌</span>
      </p>
    </div>
    <slot name="action" />
  </div>
</template>