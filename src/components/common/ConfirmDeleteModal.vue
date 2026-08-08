<script setup>
import warning3d from '@/assets/images/icons-3d/warning_3d.png'
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
    <div class="flex flex-col items-center pt-(--space-3) text-center">
      <img
        :src="warning3d"
        alt=""
        class="mb-(--space-4) h-[76px] w-auto object-contain"
      >

      <h2 class="mb-(--space-2) text-(length:--font-xl) font-bold text-(color:--color-navy)">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="mb-(--space-5) max-w-[300px] whitespace-pre-line text-(length:--font-sm) leading-relaxed text-(color:--color-slate-muted)"
      >
        {{ description }}
      </p>

      <ul
        v-if="items.length"
        class="mb-(--space-5) flex w-full flex-col gap-(--space-3) rounded-(--radius-xl) border border-(--color-danger-surface) bg-(--color-danger-soft) p-(--space-4) text-left"
      >
        <li
          v-for="item in items"
          :key="item"
          class="flex items-start gap-(--space-2) text-(length:--font-sm) leading-relaxed text-(color:--color-danger-muted)"
        >
          <span class="mt-[7px] size-[6px] shrink-0 rounded-full bg-(--color-danger-strong)" />
          {{ item }}
        </li>
      </ul>

      <div class="grid w-full grid-cols-2 gap-(--space-3)">
        <AppButton
          type="button"
          variant="neutral"
          size="lg"
          class="w-full"
          @click="close"
        >
          {{ cancelLabel }}
        </AppButton>
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
