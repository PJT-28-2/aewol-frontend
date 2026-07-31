<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
  >
    <path d="m24 9.5a3.5 3.5 0 1 0 -5 3.15v3.35a5 5 0 0 1 -10 0v-.151a7.513 7.513 0 0 0 6-7.349v-5a3.5 3.5 0 0 0 -3.5-3.5h-2.5v3h2.5a.5.5 0 0 1 .5.5v5a4.5 4.5 0 0 1 -9 0v-5a.5.5 0 0 1 .5-.5h2.5v-3h-2.5a3.5 3.5 0 0 0 -3.5 3.5v5a7.513 7.513 0 0 0 6 7.349v.151a8 8 0 0 0 16 0v-3.35a3.491 3.491 0 0 0 2-3.15z" />
  </svg>
</template>
