<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
});
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <template v-if="filled">
      <path :fill="color" d="M7.7 6.1A7.1 7.1 0 0 1 12 4.7c1.6 0 3.08.52 4.3 1.4A5.1 5.1 0 0 1 20.5 4c.83 0 1.5.67 1.5 1.5v2.25a5.25 5.25 0 0 1-2.84 4.66v1.26A7.17 7.17 0 0 1 12 20.83a7.17 7.17 0 0 1-7.16-7.16V12.4A5.25 5.25 0 0 1 2 7.75V5.5C2 4.67 2.67 4 3.5 4a5.1 5.1 0 0 1 4.2 2.1Z" />
      <circle cx="9" cy="12" r="1" fill="var(--color-white)" />
      <circle cx="15" cy="12" r="1" fill="var(--color-white)" />
      <path d="M10.25 15.25h3.5c0 1.05-.78 1.9-1.75 1.9s-1.75-.85-1.75-1.9Z" fill="var(--color-white)" />
    </template>
    <template v-else>
      <path d="M7.7 6.1A7.1 7.1 0 0 1 12 4.7c1.6 0 3.08.52 4.3 1.4A5.1 5.1 0 0 1 20.5 4c.83 0 1.5.67 1.5 1.5v2.25a5.25 5.25 0 0 1-2.84 4.66v1.26A7.17 7.17 0 0 1 12 20.83a7.17 7.17 0 0 1-7.16-7.16V12.4A5.25 5.25 0 0 1 2 7.75V5.5C2 4.67 2.67 4 3.5 4a5.1 5.1 0 0 1 4.2 2.1Z" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="9" cy="12" r="1" :fill="color" />
      <circle cx="15" cy="12" r="1" :fill="color" />
      <path d="M10.25 15.25h3.5c0 1.05-.78 1.9-1.75 1.9s-1.75-.85-1.75-1.9Z" :fill="color" />
    </template>
  </svg>
</template>
