<script setup>
import { ref } from 'vue'
import IconBackspace from './icons/IconBackspace.vue'

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

const DEFAULT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '__shuffle__', '0', '⌫']

const keypadKeys = ref([...DEFAULT_KEYS])

// "재배열" 버튼을 눌렀을 때만 숫자 10개의 위치를 섞어요 — 자동으로 계속 섞으면 오히려
// 사용자가 매번 숫자 위치를 다시 찾아야 해서 입력이 느려지니, 숄더서핑이 걱정될 때만
// 직접 섞을 수 있게 버튼으로 뒀어요. 재배열 버튼과 지우기 버튼은 조작 편의를 위해
// 항상 같은 자리(맨 끝 줄 양끝)에 고정하고, 숫자 10개만 섞어요.
function shuffle() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  keypadKeys.value = [...digits.slice(0, 9), '__shuffle__', digits[9], '⌫']
}

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
    <div class="grid grid-cols-3 gap-x-(--space-5) gap-y-(--space-3)">
      <template
        v-for="key in keypadKeys"
        :key="key || 'blank'"
      >
        <button
          v-if="key === '__shuffle__'"
          type="button"
          class="mx-auto flex size-14 touch-manipulation select-none items-center justify-center rounded-full text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark) transition-transform active:scale-95"
          aria-label="숫자판 재배열"
          @click="shuffle"
        >
          재배열
        </button>
        <button
          v-else
          type="button"
          class="mx-auto flex size-14 touch-manipulation select-none items-center justify-center text-(length:--font-xl) font-bold text-(color:--color-navy) transition-transform active:scale-95"
          :aria-label="key === '⌫' ? '지우기' : key"
          @click="key === '⌫' ? handleBackspace() : handleKeyPress(key)"
        >
          <IconBackspace
            v-if="key === '⌫'"
            :size="22"
            color="var(--color-navy)"
            aria-hidden="true"
          />
          <template v-else>
            {{ key }}
          </template>
        </button>
      </template>
    </div>
  </div>
</template>
