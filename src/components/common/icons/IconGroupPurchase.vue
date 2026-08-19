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
      d="M5.5 8h13l1 13h-15l1-13ZM9 8a3 3 0 0 1 6 0h-2a1 1 0 0 0-2 0H9Z"
    />
    <circle
      cx="8.5"
      cy="13"
      r="1.25"
      fill="var(--color-white)"
    />
    <circle
      cx="12"
      cy="12"
      r="1.5"
      fill="var(--color-white)"
    />
    <circle
      cx="15.5"
      cy="13"
      r="1.25"
      fill="var(--color-white)"
    />
    <path
      fill="var(--color-white)"
      d="M6.5 17.5c.1-2 1-3.1 2-3.1.7 0 1.3.4 1.6 1.1.4-1.4 1-2.1 1.9-2.1s1.5.7 1.9 2.1c.3-.7.9-1.1 1.6-1.1 1 0 1.9 1.1 2 3.1h-11Z"
    />
  </svg>
</template>
