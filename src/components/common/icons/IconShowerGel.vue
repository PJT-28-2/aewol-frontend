<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M9 2h6v3H9V2Zm-1 5h8a3 3 0 0 1 3 3v11H5V10a3 3 0 0 1 3-3Zm1 6h6v2H9v-2Z"
    />
  </svg>
</template>
