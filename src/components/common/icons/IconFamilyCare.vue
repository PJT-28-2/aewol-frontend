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
    <circle
      cx="7"
      cy="7"
      r="2.4"
      :fill="color"
    />
    <circle
      cx="17"
      cy="7"
      r="2.4"
      :fill="color"
    />
    <path
      :fill="color"
      d="M2.8 13.5c.2-2.7 1.7-4.4 4.2-4.4 1.6 0 2.8.7 3.5 2-1.1.3-2.1.9-2.9 1.8a5 5 0 0 0-.4.6H2.8Zm18.4 0h-4.4a5 5 0 0 0-.4-.6c-.8-.9-1.8-1.5-2.9-1.8.7-1.3 1.9-2 3.5-2 2.5 0 4 1.7 4.2 4.4Z"
    />
    <path
      :fill="color"
      fill-rule="evenodd"
      d="m9 15-1.2-1.1c-.6-.5-1.3.1-1 1l.8 2v1c0 2 1.8 3.1 4.4 3.1s4.4-1.1 4.4-3.1v-1l.8-2c.3-.9-.4-1.5-1-1L15 15a4.5 4.5 0 0 0-6 0Zm1.3 2.4a.65.65 0 1 0 0-1.3.65.65 0 0 0 0 1.3Zm3.4 0a.65.65 0 1 0 0-1.3.65.65 0 0 0 0 1.3Z"
    />
  </svg>
</template>
