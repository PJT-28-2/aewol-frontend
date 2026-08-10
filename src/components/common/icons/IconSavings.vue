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
    fill="none"
    aria-hidden="true"
  >
    <path
      :fill="color"
      fill-rule="evenodd"
      d="M4.5 11.8A6.8 6.8 0 0 1 17.6 9L21 10.2v4.2l-2.5.8a6.8 6.8 0 0 1-2.3 2.6V21h-2.7v-2H9.4v2H6.7v-3.2a6.8 6.8 0 0 1-2.2-6Zm4.4-4.2h6V6h-6v1.6Zm8.9 4.1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
    />
  </svg>
</template>
