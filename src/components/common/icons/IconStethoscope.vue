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
    <path
      fill-rule="evenodd"
      d="M3 2h4v2H6v4a4 4 0 0 0 8 0V4h-1V2h4v2h-1v4a6 6 0 0 1-5 5.9V16a4 4 0 0 0 8 0v-2.2a3 3 0 1 1 2 0V16a6 6 0 0 1-12 0v-2.1A6 6 0 0 1 4 8V4H3V2Zm17 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
    />
  </svg>
</template>
