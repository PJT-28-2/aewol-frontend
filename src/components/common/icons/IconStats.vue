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
    aria-hidden="true"
  >
    <rect
      x="4"
      y="12"
      width="4"
      height="8"
      rx="1"
    />
    <rect
      x="10"
      y="5"
      width="4"
      height="15"
      rx="1"
    />
    <rect
      x="16"
      y="8"
      width="4"
      height="12"
      rx="1"
    />
  </svg>
</template>
