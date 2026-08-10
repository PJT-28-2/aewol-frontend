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
      d="M12 3.8a7 7 0 0 0-7 7c0 4.9 7 10.7 7 10.7s7-5.8 7-10.7a7 7 0 0 0-7-7Zm-1.2 3.4h2.4v2.4h2.4V12h-2.4v2.4h-2.4V12H8.4V9.6h2.4V7.2Z"
    />
  </svg>
</template>
