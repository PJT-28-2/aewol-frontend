<script setup>
import petDeleteWarning from '@/assets/images/pet-delete-warning.png'
import AppButton from './AppButton.vue'
import BottomSheet from './BottomSheet.vue'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
  confirmLabel: {
    type: String,
    default: '삭제하기',
  },
  confirmLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    size="tall"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col items-center text-center">
      <img
        :src="petDeleteWarning"
        alt=""
        class="w-[139px] h-[139px] mb-(--space-4)"
      >

      <h2 class="text-(length:--font-lg) font-bold text-(color:--color-navy) mb-(--space-2)">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-(length:--font-sm) text-(color:--color-slate-muted) mb-(--space-4) whitespace-pre-line"
      >
        {{ description }}
      </p>

      <ul
        v-if="items.length"
        class="w-full bg-(--color-danger-soft) rounded-(--radius-lg) p-(--space-4) flex flex-col gap-(--space-2) mb-(--space-5) text-left"
      >
        <li
          v-for="item in items"
          :key="item"
          class="flex items-center gap-(--space-2) text-(length:--font-sm) text-(color:--color-danger-muted)"
        >
          <span class="w-[6px] h-[6px] rounded-full bg-(--color-danger-strong) shrink-0" />
          {{ item }}
        </li>
      </ul>

      <div class="grid grid-cols-2 gap-(--space-3) w-full">
        <button
          type="button"
          class="w-full h-[52px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) text-(color:--color-slate-dark) text-(length:--font-base) font-semibold"
          @click="close"
        >
          {{ cancelLabel }}
        </button>
        <AppButton
          type="button"
          variant="danger"
          size="lg"
          class="w-full"
          :loading="confirmLoading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </BottomSheet>
</template>
