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
  >
    <path
      :fill="color"
      fill-rule="evenodd"
      d="m12 3 7 2.6v5.1c0 4.6-2.8 8-7 10.3-4.2-2.3-7-5.7-7-10.3V5.6L12 3Zm-2.4 7.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm4.8 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM12 9a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 12 9Zm0 6.4c2 0 3.3-.8 3.3-2 0-1.1-1.3-2.5-3.3-2.5s-3.3 1.4-3.3 2.5c0 1.2 1.3 2 3.3 2Z"
    />
  </svg>
</template>
