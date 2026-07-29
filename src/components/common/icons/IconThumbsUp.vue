<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
});
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" :fill="color">
    <path
      d="M2 21h4V9H2v12Zm19.83-11.6c.11-.25.17-.53.17-.82V7c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L12.17 0 6.59 5.59C6.22 5.95 6 6.45 6 7v11c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3-7.02c.1-.23.16-.48.16-.76v-1.6Z"
    />
  </svg>
</template>
