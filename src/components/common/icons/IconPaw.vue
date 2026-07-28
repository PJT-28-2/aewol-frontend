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
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <ellipse
      cx="12"
      cy="16.5"
      rx="5"
      ry="3.5"
    />
    <ellipse
      cx="5.5"
      cy="10"
      rx="2"
      ry="2.5"
    />
    <ellipse
      cx="9.5"
      cy="6.5"
      rx="2"
      ry="2.5"
    />
    <ellipse
      cx="14.5"
      cy="6.5"
      rx="2"
      ry="2.5"
    />
    <ellipse
      cx="18.5"
      cy="10"
      rx="2"
      ry="2.5"
    />
  </svg>
</template>
