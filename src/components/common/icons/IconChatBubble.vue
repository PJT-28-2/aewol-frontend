<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
});
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" :fill="color">
    <path
      d="M12 2C6.48 2 2 5.94 2 10.8c0 2.62 1.34 4.96 3.44 6.56-.15 1.13-.6 2.36-1.3 3.55a.5.5 0 0 0 .58.73c1.98-.53 3.53-1.29 4.66-2 .84.15 1.71.22 2.62.22 5.52 0 10-3.94 10-8.8S17.52 2 12 2Z"
    />
  </svg>
</template>
