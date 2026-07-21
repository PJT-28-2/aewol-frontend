<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value),
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
</script>

<template>
  <button
    class="app-btn"
    :class="[
      `app-btn--${variant}`,
      `app-btn--${size}`,
      { 'app-btn--block': block, 'app-btn--loading': loading },
    ]"
    :disabled="disabled || loading"
  >
    <LoadingSpinner v-if="loading" size="sm" :color="variant === 'secondary' || variant === 'ghost' ? 'navy' : 'white'" />
    <span v-else class="app-btn__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: opacity 0.2s, background-color 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-btn:not(:disabled):hover {
  opacity: 0.9;
}

/* Variants */
.app-btn--primary {
  background-color: var(--color-gold);
  color: var(--color-white);
}

.app-btn--secondary {
  background-color: var(--color-white);
  color: var(--color-navy);
  border: 1px solid var(--color-navy);
}

.app-btn--danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.app-btn--ghost {
  background-color: transparent;
  color: var(--color-navy);
}

.app-btn--ghost:not(:disabled):hover {
  background-color: var(--color-gray-100);
  opacity: 1;
}

/* Sizes */
.app-btn--sm {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--font-sm);
}

.app-btn--md {
  height: 40px;
  padding: 0 var(--space-5);
  font-size: var(--font-md);
}

.app-btn--lg {
  height: 48px;
  padding: 0 var(--space-6);
  font-size: var(--font-base);
}

/* Block */
.app-btn--block {
  display: flex;
  width: 100%;
}

/* Loading */
.app-btn--loading {
  pointer-events: none;
}

.app-btn__content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
