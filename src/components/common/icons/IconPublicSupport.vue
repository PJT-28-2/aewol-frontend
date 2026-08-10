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
      d="M12 11.7C7.4 9 6.2 6.4 7.8 4.8A2.6 2.6 0 0 1 12 5.6a2.6 2.6 0 0 1 4.2-.8c1.6 1.6.4 4.2-4.2 6.9ZM3 12.6h3.8l2.3 2.1h4.4a2.4 2.4 0 0 1 2.4 2.1H9.2v1.5l4.4 1.1 6.7-4a1.5 1.5 0 0 1 1.7 2.4l-7.3 4.8a2 2 0 0 1-1.6.2L7 21l-2 .8H3v-9.2Z"
    />
  </svg>
</template>
