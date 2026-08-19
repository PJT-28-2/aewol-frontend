<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="7.5"
      cy="12"
      r="1.6"
      :fill="color"
    />
    <circle
      cx="12"
      cy="12"
      r="1.6"
      :fill="color"
    />
    <circle
      cx="16.5"
      cy="12"
      r="1.6"
      :fill="color"
    />
  </svg>
</template>
