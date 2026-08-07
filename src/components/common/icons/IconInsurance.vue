<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
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
      v-if="filled"
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 1.2 20.5 4v7.2c0 5.4-3.47 9.6-8.5 11.6-5.03-2-8.5-6.2-8.5-11.6V4L12 1.2Zm4.55 7.05a1.15 1.15 0 0 0-1.63 0l-4.08 4.08-1.76-1.76a1.15 1.15 0 1 0-1.63 1.63l2.58 2.58a1.15 1.15 0 0 0 1.63 0l4.9-4.9a1.15 1.15 0 0 0 0-1.63Z"
    />
    <path
      v-else
      d="M12 2.2 19.5 4.67v6.53c0 4.8-3.08 8.53-7.5 10.6-4.42-2.07-7.5-5.8-7.5-10.6V4.67L12 2.2Z"
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      v-if="!filled"
      d="m8.3 11.35 2.25 2.25 5.15-5.15"
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
