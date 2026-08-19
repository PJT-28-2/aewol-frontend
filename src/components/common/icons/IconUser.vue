<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
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
    <template v-if="filled">
      <circle
        cx="12"
        cy="7"
        r="5"
        :fill="color"
      />
      <path
        :fill="color"
        d="M3 21a7.5 7.5 0 0 1 7.5-7.5h3A7.5 7.5 0 0 1 21 21v1H3v-1Z"
      />
    </template>
    <template v-else>
      <circle
        cx="12"
        cy="7"
        r="5"
        fill="none"
        :stroke="color"
        stroke-width="2"
      />
      <path
        d="M3 22v-1a7.5 7.5 0 0 1 7.5-7.5h3A7.5 7.5 0 0 1 21 21v1"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
      />
    </template>
  </svg>
</template>
