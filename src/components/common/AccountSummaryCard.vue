<script setup>
import { computed } from 'vue';
import { getBankMeta, formatWon } from '@/utils/bankMeta';
import BankBadge from '@/components/common/BankBadge.vue';

const props = defineProps({
  bankCode: { type: String, required: true },
  // 계좌 목록 항목에서만 노출 (해제확인/완료 요약 카드는 안 보여줌)
  accountNumberMasked: { type: String, default: '' },
  balance: { type: [Number, String], default: 0 },
  isPrimary: { type: Boolean, default: false },
  badgeSize: { type: Number, default: 40 },
  // 계좌 목록 항목만 테두리가 있고, 해제확인/완료 카드는 배경색만 있음
  bordered: { type: Boolean, default: false },
});

const bankMeta = computed(() => getBankMeta(props.bankCode));
</script>

<template>
  <div
    class="flex items-start gap-3 p-4 rounded-2xl bg-(--color-surface) text-left"
    :class="bordered ? 'border border-(--color-border)' : ''"
  >
    <BankBadge :bank-code="bankCode" :size="badgeSize" />
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <div class="flex items-baseline gap-1.5">
          <span class="font-bold text-(color:--color-navy) text-(length:--font-base)">{{ bankMeta.name }}</span>
          <span v-if="accountNumberMasked" class="text-(length:--font-sm) text-(color:--color-gray-500)">
            {{ accountNumberMasked }}
          </span>
        </div>
        <slot name="action" />
      </div>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mt-1">
        {{ formatWon(balance) }}<span v-if="isPrimary"> · 주계좌</span>
      </p>
    </div>
  </div>
</template>
