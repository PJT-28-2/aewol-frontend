<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  size: {
    type: [Number, String],
    default: 24,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})
</script>

<template>
  <svg
    v-bind="$attrs"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :fill="color"
    :width="size"
    :height="size"
    aria-hidden="true"
  >
    <path d="M21.75 15.05A9.75 9.75 0 0 1 8.95 2.25a.75.75 0 0 0-.86-.95A10.5 10.5 0 1 0 22.7 15.91a.75.75 0 0 0-.95-.86Z" />
  </svg>
</template>
