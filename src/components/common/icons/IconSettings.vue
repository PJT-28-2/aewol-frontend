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
    fill="none"
    aria-hidden="true"
  >
    <path
      :fill="color"
      fill-rule="evenodd"
      d="m9.7 3.2.5-1.2h3.6l.5 1.2c.5.2 1 .4 1.5.6l1.2-.5 2.5 2.5-.5 1.3c.3.4.5.9.6 1.4l1.3.5v3.6l-1.3.5c-.1.5-.3 1-.6 1.4l.5 1.3-2.5 2.5-1.2-.5c-.5.2-1 .4-1.5.6l-.5 1.2h-3.6l-.5-1.2c-.5-.2-1-.4-1.5-.6l-1.2.5-2.5-2.5.5-1.3c-.3-.4-.5-.9-.6-1.4l-1.3-.5V9l1.3-.5c.1-.5.3-1 .6-1.4l-.5-1.3L7 3.3l1.2.5c.5-.2 1-.4 1.5-.6ZM12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"
    />
  </svg>
</template>
