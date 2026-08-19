<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
  tile: { type: Boolean, default: false },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="filled && tile"
      :fill="color"
      fill-rule="evenodd"
      d="M6 5h11a2 2 0 0 1 2 2v1h.3a2.7 2.7 0 0 1 2.7 2.7v6.6a2.7 2.7 0 0 1-2.7 2.7H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Zm11.3 7a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
    />
    <path
      v-else-if="filled"
      :fill="color"
      fill-rule="evenodd"
      d="M5 3h13a2 2 0 0 1 2 2v2h.25A2.75 2.75 0 0 1 23 9.75v8.5A2.75 2.75 0 0 1 20.25 21H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm12.5 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
    />
    <path
      v-else
      d="M5 4h13a2 2 0 0 1 2 2v1H5a3 3 0 0 1 0-6h11M5 7h15.25A2.75 2.75 0 0 1 23 9.75v8.5A2.75 2.75 0 0 1 20.25 21H5a4 4 0 0 1-4-4V5"
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      v-if="!filled"
      cx="17.5"
      cy="12.5"
      r="1.25"
      :fill="color"
    />
  </svg>
</template>
