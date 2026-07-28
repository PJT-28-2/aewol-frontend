<script setup>
defineProps({
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
      class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-(color:--color-danger) ml-[2px]"
      >*</span>
    </label>

    <input
      class="w-full h-[46px] px-(--space-3) text-(length:--font-md) text-(color:--color-gray-900) bg-(--color-surface) border rounded-(--radius-lg) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) focus:shadow-[0_0_0_3px_rgba(27,42,73,0.1)]"
      :class="error ? 'border-(--color-danger)' : 'border-(--color-border)'"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="onInput"
    >

    <p
      v-if="error"
      class="text-(length:--font-xs) text-(color:--color-danger)"
    >
      {{ error }}
    </p>
  </div>
</template>
