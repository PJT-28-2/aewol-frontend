<script setup>
import { computed, useId } from 'vue'

const inputId = useId()
const errorId = useId()

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: [String, Number],
    default: null,
  },
  inputmode: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'soft'].includes(value),
  },
})

const inputClasses = computed(() => {
  const stateClass = props.error
    ? 'border-(--color-danger-strong) focus:border-(--color-danger-strong)'
    : 'border-(--color-card-border) focus:border-(--color-leaf-dark)'

  return [
    stateClass,
    props.variant === 'soft'
      ? 'h-(--control-height-lg) rounded-(--radius-xl) bg-(--color-app-bg) px-(--space-4) focus:bg-(--color-white) focus:ring-2 focus:ring-(--color-leaf-soft)'
      : 'h-(--control-height-md) rounded-(--radius-lg) bg-(--color-surface) px-(--space-3)',
  ]
})

const emit = defineEmits(['update:modelValue'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="flex flex-col gap-(--space-1) w-full">
    <label
      v-if="label"
      :for="inputId"
      class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-(color:--color-danger-strong) ml-[2px]"
      >*</span>
    </label>

    <input
      :id="inputId"
      class="w-full border text-(length:--font-md) text-(color:--color-gray-900) outline-none transition-[border-color,background-color,box-shadow] placeholder:text-(color:--color-slate-muted)"
      :class="inputClasses"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :maxlength="maxlength"
      :inputmode="inputmode"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      @input="onInput"
    >

    <p
      v-if="error"
      :id="errorId"
      class="text-(length:--font-xs) text-(color:--color-danger-strong)"
    >
      {{ error }}
    </p>
  </div>
</template>
