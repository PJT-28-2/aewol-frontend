<script setup>
import { computed } from 'vue';
import { getBankMeta } from '@/utils/bankMeta';

const props = defineProps({
  bankCode: { type: String, required: true },
  // 알 수 없는 은행 코드일 때 뱃지에 표시할 대체 이름 (예: API가 내려주는 은행명)
  fallbackName: { type: String, default: '' },
  size: { type: Number, default: 44 },
});

// 뱃지 안 텍스트(KB, 신한 등)가 박스 크기에 비례해 보이도록 잡은 비율이에요.
// 고정 폰트 크기 대신 이 비율로 계산해서 size prop(36/40/44 등)이 바뀌어도 항상 자연스럽게 맞아요.
const BADGE_FONT_RATIO = 0.32;

const meta = computed(() => getBankMeta(props.bankCode, props.fallbackName));
</script>

<template>
  <img
    v-if="meta.logo"
    :src="meta.logo"
    alt=""
    class="shrink-0 object-cover"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
  <div
    v-else
    class="flex items-center justify-center rounded-(--radius-md) font-bold shrink-0"
    :class="[meta.bg, meta.text]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * BADGE_FONT_RATIO}px` }"
  >
    {{ meta.label }}
  </div>
</template>