<script setup>
defineProps({
  size: { type: [String, Number], default: 'var(--icon-size-md)' },
  color: { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="var(--icon-stroke-width)"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
</template>
