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
    class="overflow-hidden rounded-[22px] border border-(--color-card-border) bg-(--color-white)"
    :class="[padding ? 'p-(--space-5)' : '', shadow ? 'shadow-(--shadow-card)' : '']"
  >
    <slot />
  </div>
</template>
