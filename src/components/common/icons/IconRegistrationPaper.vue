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
      d="M6 3.8h12a2 2 0 0 1 2 2v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Zm1.8 4.3h8.4V6.6H7.8v1.5Zm0 3.4h8.4V10H7.8v1.5Zm0 3.4h5.2v-1.5H7.8v1.5Zm6.4 2.2 1.7 1.7 3.2-3.2-1.2-1.2-2 2- .5-.5-1.2 1.2Z"
    />
  </svg>
</template>
