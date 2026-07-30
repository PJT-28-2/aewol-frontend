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
    <circle cx="21.517" cy="12.066" r="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="2.5" cy="12" r="2.5" />
  </svg>
</template>
