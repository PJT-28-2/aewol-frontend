<script setup>
import { ref, watch } from 'vue'
import BottomSheet from './BottomSheet.vue'
import IconDelete from './icons/IconDelete.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '비밀번호를 입력해주세요',
  },
  description: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'complete'])

const PIN_LENGTH = 6
const pinInput = ref('')
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

// 바텀시트가 열릴 때마다 이전 입력을 초기화
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) pinInput.value = ''
  },
)

function handleKeyPress(digit) {
  if (!digit || pinInput.value.length >= PIN_LENGTH) return

  pinInput.value += digit
  if (pinInput.value.length === PIN_LENGTH) {
    const pin = pinInput.value
    emit('update:modelValue', false)
    emit('complete', pin)
  }
}

function handleBackspace() {
  pinInput.value = pinInput.value.slice(0, -1)
}
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="text-center">
      <h2 class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2)"
      >
        {{ description }}
      </p>

      <div class="flex items-center justify-center gap-(--space-2) mt-(--space-6)">
        <span
          v-for="index in PIN_LENGTH"
          :key="index"
          class="w-3 h-3 rounded-full"
          :class="
            index <= pinInput.length
              ? 'bg-(--color-navy)'
              : 'border border-(--color-border)'
          "
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-(--space-4) mt-(--space-7)">
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
  </BottomSheet>
</template>
