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
    viewBox="0 0 24 18"
    :fill="color"
    aria-hidden="true"
  >
    <path d="M21 0H3C2.20435 0 1.44129 0.316071 0.87868 0.87868C0.31607 1.44129 0 2.20435 0 3V18H24V3C24 2.20435 23.6839 1.44129 23.1213 0.87868C22.5587 0.316071 21.7956 0 21 0ZM21 3V5H3V3H21ZM3 15V8H21V15H3Z" />
    <path d="M7.5 13C8.32843 13 9 12.3284 9 11.5C9 10.6716 8.32843 10 7.5 10C6.67157 10 6 10.6716 6 11.5C6 12.3284 6.67157 13 7.5 13Z" />
  </svg>
</template>
