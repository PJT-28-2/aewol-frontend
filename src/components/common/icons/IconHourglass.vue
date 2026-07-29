<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 24,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="5" y="3" width="14" height="2" rx="1" />
    <rect x="5" y="19" width="14" height="2" rx="1" />
    <path d="M7,5 H17 L12,11.2 Z" />
    <path d="M7,19 H17 L12,12.8 Z" />
  </svg>
</template>
