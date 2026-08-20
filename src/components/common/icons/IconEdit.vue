<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  ><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM14 6l4 4" /></svg>
</template>
