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
      :fill="color"
      d="M12 4.3a5.7 5.7 0 0 1 5.7 5.7v2.8l1.5 2.8a1.3 1.3 0 0 1-1.1 1.9H5.9a1.3 1.3 0 0 1-1.1-1.9l1.5-2.8V10A5.7 5.7 0 0 1 12 4.3Zm-2.4 14.5h4.8a2.5 2.5 0 0 1-4.8 0Z"
    />
  </svg>
</template>
