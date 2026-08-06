<script setup>
defineProps({
  padding: {
    type: Boolean,
    default: true,
  },
  shadow: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div
    class="app-card"
    :class="{
      'app-card--padded': padding,
      'app-card--shadow': shadow,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.app-card--padded {
  padding: var(--space-4);
}

.app-card--shadow {
  box-shadow: var(--shadow-sm);
}
</style>
