<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
});
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      v-if="filled"
      :fill="color"
      fill-rule="evenodd"
      d="M10.66 2.55a2 2 0 0 1 2.68 0l7 6.33A2 2 0 0 1 21 10.36V20a2 2 0 0 1-2 2h-4.5v-5.25a2.5 2.5 0 0 0-5 0V22H5a2 2 0 0 1-2-2v-9.64a2 2 0 0 1 .66-1.48l7-6.33Z"
    />
    <path
      v-else
      d="m3.75 9.65 7-6.33a1.88 1.88 0 0 1 2.5 0l7 6.33c.48.43.75 1.04.75 1.69V20a2 2 0 0 1-2 2h-4.5v-5.25a2.5 2.5 0 0 0-5 0V22H5a2 2 0 0 1-2-2v-8.66c0-.65.27-1.26.75-1.69Z"
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
