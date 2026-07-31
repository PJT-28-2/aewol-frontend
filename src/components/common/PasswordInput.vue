<script setup>
import { computed, ref, useAttrs } from 'vue'
import IconEye from '@/components/common/icons/IconEye.vue'

defineOptions({
  inheritAttrs: false,
})

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  inputClass: {
    type: [String, Array, Object],
    default: '',
  },
  wrapperClass: {
    type: [String, Array, Object],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const attrs = useAttrs()
const isPasswordVisible = ref(false)
const inputType = computed(() =>
  isPasswordVisible.value ? 'text' : 'password',
)

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div :class="['relative min-w-0 w-full', wrapperClass]">
    <input
      v-bind="attrs"
      :class="[inputClass, 'pr-11']"
      :type="inputType"
      :value="modelValue"
      @input="handleInput"
    >
    <button
      class="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center text-(color:--color-slate-muted) disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      :disabled="attrs.disabled"
      :aria-label="isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'"
      :aria-pressed="isPasswordVisible"
      @mousedown.prevent
      @click="togglePasswordVisibility"
    >
      <IconEye
        :size="20"
        :crossed="isPasswordVisible"
      />
    </button>
  </div>
</template>
