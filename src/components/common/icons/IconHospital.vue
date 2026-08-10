<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
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
      d="M6 5.5A2.5 2.5 0 0 1 8.5 3h7A2.5 2.5 0 0 1 18 5.5V20h-4.2v-3.5h-3.6V20H6V5.5Zm4.8.3v2h-2v2.4h2v2h2.4v-2h2V7.8h-2v-2h-2.4Z"
    />
  </svg>
</template>
