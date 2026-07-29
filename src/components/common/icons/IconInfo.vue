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
    <circle
      cx="12"
      cy="12"
      r="9"
    />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
</template>
