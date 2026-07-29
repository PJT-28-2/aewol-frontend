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
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
</template>
