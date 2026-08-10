<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
  >
    <path
      d="M22 3h-4v12h4V3ZM2.17 14.6c-.11.25-.17.53-.17.82V17c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 24l5.58-5.59c.37-.36.59-.86.59-1.41V6c0-1.1-.9-2-2-2H5c-.83 0-1.54.5-1.84 1.22l-3 7.02c-.1.23-.16.48-.16.76v1.6Z"
    />
  </svg>
</template>
