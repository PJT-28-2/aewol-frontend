<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) =>
      [
        'primary',
        'secondary',
        'danger',
        'ghost',
        'navy',
        'olive',
        'olive-outline',
        'white',
      ].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value),
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
  pill: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
})

const variantClasses = {
  primary: 'bg-(--color-leaf) text-(color:--color-navy) hover:opacity-90',
  secondary:
    'bg-(--color-white) text-(color:--color-navy) border border-(--color-navy) hover:opacity-90',
  danger: 'bg-(--color-danger-strong) text-(color:--color-white) hover:opacity-90',
  ghost: 'bg-transparent text-(color:--color-navy) hover:bg-(--color-gray-100)',
  navy: 'bg-(--color-navy) text-(color:--color-white) hover:opacity-90',
  olive: 'bg-(--color-olive) text-(color:--color-white) hover:opacity-90',
  'olive-outline':
    'bg-(--color-white) text-(color:--color-olive) border border-(--color-olive) hover:opacity-90',
  white: 'bg-(--color-white) text-(color:--color-navy) hover:opacity-90',
}

const sizeClasses = {
  xs: 'h-(--support-action-height) min-w-(--support-action-width) px-(--space-2) text-(length:--font-xs)',
  sm: 'h-(--space-7) px-(--space-3) text-(length:--font-sm)',
  md: 'h-(--space-8) px-(--space-5) text-(length:--font-md)',
  lg: 'h-(--control-height-lg) px-(--space-6) text-(length:--font-base)',
}

const radiusClasses = {
  xs: 'rounded-(--radius-md)',
  sm: 'rounded-(--radius-xl)',
  md: 'rounded-(--radius-xl)',
  lg: 'rounded-(--radius-xl)',
}

const radiusClass = computed(() =>
  props.pill ? 'rounded-(--radius-full)' : radiusClasses[props.size],
)

const spinnerColor = ['secondary', 'ghost', 'primary', 'white'].includes(props.variant)
  ? 'navy'
  : props.variant === 'olive-outline'
    ? 'olive'
    : 'white'
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-(--space-2) font-semibold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      radiusClass,
      block ? 'flex w-full' : '',
      iconOnly ? '!min-w-0 !px-0 aspect-square' : '',
      loading ? 'pointer-events-none' : '',
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <LoadingSpinner
      v-if="loading"
      size="sm"
      :color="spinnerColor"
    />
    <span
      class="flex items-center gap-(--space-2)"
      :class="{ 'sr-only': loading }"
    >
      <slot />
    </span>
  </button>
</template>
