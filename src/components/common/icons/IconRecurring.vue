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
      d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-12A2.5 2.5 0 0 1 6.5 4ZM4 8.5h16v-2A2.5 2.5 0 0 0 17.5 4h-11A2.5 2.5 0 0 0 4 6.5v2Z"
    />
    <rect
      x="7"
      y="3"
      width="2"
      height="4"
      rx="1"
      :fill="color"
    />
    <path
      fill="var(--color-contrast)"
      d="M8.2 13.5a4.6 4.6 0 0 1 7.6-1.7l1.1-1.1v3.8h-3.8l1.2-1.2a2.6 2.6 0 0 0-4.1.9l-2-.7Zm7.6 3a4.6 4.6 0 0 1-7.6 1.7l-1.1 1.1v-3.8h3.8l-1.2 1.2a2.6 2.6 0 0 0 4.1-.9l2 .7Z"
    />
    <rect
      x="15"
      y="3"
      width="2"
      height="4"
      rx="1"
      :fill="color"
    />
  </svg>
</template>
