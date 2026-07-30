<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-(--radius-full) border-0 px-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
    :class="modelValue ? 'bg-(--color-olive)' : 'bg-(--color-border)'"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="toggle"
  >
    <span
      class="block size-4 rounded-(--radius-full) bg-(--color-white) transition-transform"
      :class="{ 'translate-x-5': modelValue }"
      aria-hidden="true"
    />
  </button>
</template>
