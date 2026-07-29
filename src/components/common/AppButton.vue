<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) =>
      ['primary', 'secondary', 'danger', 'ghost', 'navy'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})

const variantClasses = {
  primary: 'bg-(--color-gold) text-(color:--color-navy) hover:opacity-90',
  secondary:
    'bg-(--color-white) text-(color:--color-navy) border border-(--color-navy) hover:opacity-90',
  danger: 'bg-(--color-danger-strong) text-(color:--color-white) hover:opacity-90',
  ghost: 'bg-transparent text-(color:--color-navy) hover:bg-(--color-gray-100)',
  navy: 'bg-(--color-navy) text-(color:--color-white) hover:opacity-90',
}

const sizeClasses = {
  sm: 'h-(--space-7) px-(--space-3) text-(length:--font-sm)',
  md: 'h-(--space-8) px-(--space-5) text-(length:--font-md)',
  lg: 'h-(--control-height-lg) px-(--space-6) text-(length:--font-base)',
}

const spinnerColor = ['secondary', 'ghost', 'primary'].includes(props.variant)
  ? 'navy'
  : 'white'
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-(--space-2) rounded-(--radius-xl) font-semibold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block ? 'flex w-full' : '',
      loading ? 'pointer-events-none' : '',
    ]"
    :disabled="disabled || loading"
  >
    <LoadingSpinner
      v-if="loading"
      size="sm"
      :color="spinnerColor"
    />
    <span
      v-else
      class="flex items-center gap-(--space-2)"
    >
      <slot />
    </span>
  </button>
</template>
