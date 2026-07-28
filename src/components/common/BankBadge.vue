<script setup>
import { computed } from 'vue';
import { getBankMeta } from '@/utils/bankMeta';

const props = defineProps({
  bankCode: { type: String, required: true },
  // 알 수 없는 은행 코드일 때 뱃지에 표시할 대체 이름 (예: API가 내려주는 은행명)
  fallbackName: { type: String, default: '' },
  size: { type: Number, default: 44 },
});

const meta = computed(() => getBankMeta(props.bankCode, props.fallbackName));
</script>

<template>
  <div
    class="flex items-center justify-center rounded-lg font-bold shrink-0"
    :class="[meta.bg, meta.text]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.32}px` }"
  >
    {{ meta.label }}
  </div>
</template>