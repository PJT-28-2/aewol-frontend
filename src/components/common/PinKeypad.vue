<script setup>
import IconDelete from './icons/IconDelete.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  length: {
    type: Number,
    default: 6,
  },
})

const emit = defineEmits(['update:modelValue', 'complete'])

const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

function handleKeyPress(digit) {
  if (!digit || props.modelValue.length >= props.length) return

  const next = props.modelValue + digit
  emit('update:modelValue', next)
  if (next.length === props.length) emit('complete', next)
}

function handleBackspace() {
  emit('update:modelValue', props.modelValue.slice(0, -1))
}
</script>

<template>
  <div>
    <div class="flex items-center justify-center gap-(--space-2) mb-(--space-10)">
      <span
        v-for="index in length"
        :key="index"
        class="w-3 h-3 rounded-full"
        :class="
          index <= modelValue.length
            ? 'bg-(--color-navy)'
            : 'border border-(--color-border)'
        "
      />
    </div>

    <div class="grid grid-cols-3 gap-(--space-6)">
      <template v-for="key in keypadKeys" :key="key || 'blank'">
        <div v-if="key === ''" class="h-14" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="h-14 flex items-center justify-center text-(length:--font-2xl) font-bold text-(color:--color-navy)"
          :aria-label="key === '⌫' ? '지우기' : key"
          @click="key === '⌫' ? handleBackspace() : handleKeyPress(key)"
        >
          <IconDelete v-if="key === '⌫'" :size="20" color="var(--color-navy)" aria-hidden="true" />
          <template v-else>{{ key }}</template>
        </button>
      </template>
    </div>
  </div>
</template>
