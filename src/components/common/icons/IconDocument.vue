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
  >
    <path
      :fill="color"
      fill-rule="evenodd"
      d="M7 4.8h6.4L18 9.4v9.8H7V4.8Zm7.2 1.7v3.7h3.7l-3.7-3.7ZM9.5 13h6v1.5h-6V13Zm0 3h6v1.5h-6V16Z"
    />
  </svg>
</template>
