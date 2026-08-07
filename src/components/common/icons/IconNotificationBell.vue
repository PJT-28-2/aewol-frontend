<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M5.2 9.5a6.8 6.8 0 0 1 13.6 0v3.2l1.7 3.1a1.4 1.4 0 0 1-1.23 2.07H4.73A1.4 1.4 0 0 1 3.5 15.8l1.7-3.1V9.5Z"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M9.2 20.1a3.2 3.2 0 0 0 5.6 0"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
</template>
