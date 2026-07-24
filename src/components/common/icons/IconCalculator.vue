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
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M5 2C3.895 2 3 2.895 3 4v16c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V4c0-1.105-.895-2-2-2H5Zm1 3h12v4H6V5Zm.5 7h2v2h-2v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-8 3.5h2v2h-2v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
    />
  </svg>
</template>
