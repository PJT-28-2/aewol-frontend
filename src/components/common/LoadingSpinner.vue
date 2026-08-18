<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  color: {
    type: String,
    default: 'navy',
  },
})

const sizeMap = {
  sm: '20px',
  md: '32px',
  lg: '48px',
}

const borderMap = {
  sm: '2px',
  md: '3px',
  lg: '4px',
}

const spinnerStyle = computed(() => ({
  width: sizeMap[props.size],
  height: sizeMap[props.size],
  borderWidth: borderMap[props.size],
  borderColor: `var(--color-${props.color}) transparent transparent transparent`,
}))
</script>

<template>
  <div
    class="flex items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div
      class="animate-spin rounded-full border-solid"
      :style="spinnerStyle"
      aria-hidden="true"
    />
    <span class="sr-only">로딩 중</span>
  </div>
</template>
