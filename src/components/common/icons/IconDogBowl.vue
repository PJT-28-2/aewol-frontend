<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      :fill="color"
      d="M5 10h14l-1.4 6.2a3 3 0 0 1-2.9 2.3H9.3a3 3 0 0 1-2.9-2.3L5 10Zm4.2-3.5a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Zm8.2 0a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0ZM12 6.8c1.6 0 2.8.8 3.3 1.7H8.7c.5-.9 1.7-1.7 3.3-1.7Z"
    />
  </svg>
</template>
