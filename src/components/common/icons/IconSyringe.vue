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
    :fill="color"
    aria-hidden="true"
  >
    <path d="m16.5 2 5.5 5.5-1.7 1.7-1.1-1.1-2 2 1 1-5.8 5.8a3 3 0 0 1-4.2 0l-1.1-1.1-3.7 3.7-1.4-1.4 3.7-3.7-.6-.6a3 3 0 0 1 0-4.2l5.8-5.8 1 1 2-2-1.1-1.1L14.5 1l2 1Zm-4.2 4.2-5.8 5.8a1 1 0 0 0 0 1.4l3.1 3.1a1 1 0 0 0 1.4 0l5.8-5.8-4.5-4.5Z" />
  </svg>
</template>
