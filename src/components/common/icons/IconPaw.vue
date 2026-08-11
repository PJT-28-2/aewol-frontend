<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
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
    <ellipse
      cx="12"
      cy="16.3"
      rx="5.3"
      ry="3.8"
      :fill="color"
    />
    <ellipse
      cx="5.8"
      cy="10.3"
      rx="2"
      ry="2.6"
      :fill="color"
    />
    <ellipse
      cx="9.6"
      cy="6.9"
      rx="2"
      ry="2.6"
      :fill="color"
    />
    <ellipse
      cx="14.4"
      cy="6.9"
      rx="2"
      ry="2.6"
      :fill="color"
    />
    <ellipse
      cx="18.2"
      cy="10.3"
      rx="2"
      ry="2.6"
      :fill="color"
    />
  </svg>
</template>
