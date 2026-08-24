<script setup>
import IconClose from './icons/IconClose.vue'
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  divider: {
    type: Boolean,
    default: true,
  },
  centerTitle: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick(event) {
  if (event.target === event.currentTarget) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 [&>div]:transition-transform [&>div]:duration-200"
      enter-from-class="opacity-0 [&>div]:scale-95"
      leave-active-class="transition-opacity duration-200 [&>div]:transition-transform [&>div]:duration-200"
      leave-to-class="opacity-0 [&>div]:scale-95"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-1000 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-brand-dark)_38%,transparent)] p-(--space-4) backdrop-blur-[2px]"
        @click="onOverlayClick"
      >
        <div class="flex max-h-[90vh] w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-(--color-card-border) bg-(--color-app-bg) shadow-[0_20px_60px_color-mix(in_srgb,var(--color-brand-dark)_20%,transparent)]">
          <div
            v-if="showHeader"
            class="flex shrink-0 items-center gap-(--space-3) px-(--space-5) pt-(--space-5) pb-(--space-4)"
            :class="[
              divider ? 'border-b border-(--color-card-border)' : '',
              centerTitle ? 'justify-center text-center' : '',
            ]"
          >
            <span
              v-if="$slots.icon"
              class="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-(--color-leaf-soft) text-(color:--color-navy)"
            >
              <slot name="icon" />
            </span>
            <h2 class="min-w-0 flex-1 text-(length:--font-lg) font-bold text-(color:--color-navy)">
              {{ title }}
            </h2>
            <button
              v-if="showClose"
              type="button"
              class="flex size-[40px] shrink-0 items-center justify-center rounded-full text-(color:--color-slate-dark) transition-colors hover:bg-(--color-leaf-soft)"
              aria-label="닫기"
              @click="close"
            >
              <IconClose size="24" />
            </button>
          </div>

          <div
            v-if="$slots.default"
            class="overflow-y-auto px-(--space-5) py-(--space-5)"
          >
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex shrink-0 items-center justify-end gap-(--space-3) px-(--space-5) pt-(--space-4) pb-(--space-5)"
            :class="divider ? 'border-t border-(--color-card-border)' : ''"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
