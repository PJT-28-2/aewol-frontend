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
    focusable="false"
  >
    <path
      d="M21,24H18V19a2,2,0,0,0-2-2H8a2,2,0,0,0-2,2v5H3V19a5.006,5.006,0,0,1,5-5h8a5.006,5.006,0,0,1,5,5Z"
    />
    <path
      d="M12,12a6,6,0,1,1,6-6A6.006,6.006,0,0,1,12,12Zm0-9a3,3,0,1,0,3,3A3,3,0,0,0,12,3Z"
    />
  </svg>
</template>
