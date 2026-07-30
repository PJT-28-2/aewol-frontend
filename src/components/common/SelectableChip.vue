<script setup>
defineProps({
  selected: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  shape: {
    type: String,
    default: 'pill',
    validator: (value) => ['pill', 'rounded'].includes(value),
  },
  block: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button
    class="inline-flex h-(--control-height-sm) cursor-pointer items-center justify-center gap-(--space-1) border px-(--space-3) text-(length:--font-sm) font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) disabled:cursor-not-allowed disabled:opacity-45"
    :class="[
      shape === 'pill' ? 'rounded-(--radius-full)' : 'rounded-(--radius-lg)',
      block ? 'flex-1' : '',
      selected
        ? 'border-(--color-navy) bg-(--color-navy) text-(color:--color-white)'
        : 'border-(--color-border) bg-(--color-surface) text-(color:--color-slate-dark)',
    ]"
    type="button"
    :disabled="disabled"
    :aria-pressed="selected"
  >
    <slot />
  </button>
</template>
