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
    :fill="color"
    aria-hidden="true"
  >
    <path d="M22.8262 1.13972C22.0618 0.408212 21.0452 0 19.9879 0C18.9306 0 17.9141 0.408212 17.1496 1.13972L0 18.315V24H5.67655L22.8262 6.82474C23.5779 6.07028 24 5.04802 24 3.98223C24 2.91645 23.5779 1.89418 22.8262 1.13972ZM4.43443 20.9952H3.00029V19.559L15.6545 6.88684L17.0886 8.32212L4.43443 20.9952Z" />
  </svg>
</template>
