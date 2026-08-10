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
      :stroke="color"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m6.5 9.1-.4-4.6 3.6 2.1c.7-.3 1.5-.4 2.3-.4s1.6.1 2.3.4l3.6-2.1-.4 4.6c.8 1.1 1.2 2.4 1.2 3.8 0 3.6-2.9 6-6.7 6s-6.7-2.4-6.7-6c0-1.4.4-2.7 1.2-3.8Z"
    />
    <path
      :stroke="color"
      stroke-width="1.2"
      stroke-linecap="round"
      d="M8.4 11.5c.6.7 1.5.7 2.1 0M13.5 11.5c.6.7 1.5.7 2.1 0"
    />
    <path
      :fill="color"
      d="M12 13.1c.7 0 1.2.4 1.2.9s-.6 1.1-1.2 1.1-1.2-.6-1.2-1.1.5-.9 1.2-.9Z"
    />
    <path
      :stroke="color"
      stroke-width=".8"
      stroke-linecap="round"
      d="M12 15c-.2.7-.7 1-1.4 1M12 15c.2.7.7 1 1.4 1M8.4 14.2l-2.6-.4M8.4 15.1l-2.3.5M15.6 14.2l2.6-.4M15.6 15.1l2.3.5"
    />
  </svg>
</template>
