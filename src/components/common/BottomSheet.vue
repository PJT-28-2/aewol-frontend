<script setup>
import { nextTick, ref, useId, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'tall'].includes(value),
  },
});

const maxHeightClasses = {
  default: 'max-h-[50vh]',
  tall: 'max-h-[90vh]',
};

const emit = defineEmits(['update:modelValue']);

const titleId = useId();
const sheetRef = ref(null);
let previouslyFocusedElement = null;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function close() {
  emit('update:modelValue', false);
}

function onOverlayClick(event) {
  if (event.target === event.currentTarget) {
    close();
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    close();
    return;
  }
  if (event.key !== 'Tab' || !sheetRef.value) return;

  const focusable = sheetRef.value.querySelectorAll(
    FOCUSABLE_SELECTOR,
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isOnContainer =
    document.activeElement === sheetRef.value;

  if (
    event.shiftKey &&
    (isOnContainer || document.activeElement === first)
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (isOnContainer || document.activeElement === last)
  ) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement = document.activeElement;
      await nextTick();
      sheetRef.value?.focus();
    } else if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 [&>div]:transition-transform [&>div]:duration-300 [&>div]:ease-out"
      enter-from-class="opacity-0 [&>div]:translate-y-full"
      leave-active-class="transition-opacity duration-300 [&>div]:transition-transform [&>div]:duration-300 [&>div]:ease-in"
      leave-to-class="opacity-0 [&>div]:translate-y-full"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-1000 flex items-end bg-[color-mix(in_srgb,var(--color-navy)_38%,transparent)] backdrop-blur-[2px]"
        @click="onOverlayClick"
      >
        <div
          ref="sheetRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          class="mx-auto flex w-full max-w-(--layout-max-width) flex-col overflow-hidden rounded-t-[32px] border-x border-t border-(--color-card-border) bg-(--color-app-bg) pb-[env(safe-area-inset-bottom,0)] shadow-[0_-12px_40px_color-mix(in_srgb,var(--color-navy)_14%,transparent)] outline-none"
          :class="maxHeightClasses[size]"
          @keydown="onKeydown"
        >
          <button
            type="button"
            class="flex w-full shrink-0 justify-center pt-(--space-3) pb-(--space-1)"
            aria-label="닫기"
            @click="close"
          >
            <span
              class="h-[5px] w-[44px] rounded-full bg-(--color-slate-light)"
            />
          </button>

          <h2
            v-if="title"
            :id="titleId"
            class="shrink-0 px-(--space-5) pt-(--space-3) pb-(--space-3) text-center text-(length:--font-lg) font-bold text-(color:--color-navy)"
          >
            {{ title }}
          </h2>

          <div
            class="min-h-0 flex-1 overflow-y-auto px-(--space-5) pt-(--space-3) pb-(--space-7) [scrollbar-color:transparent_transparent] scrollbar-thin hover:[scrollbar-color:var(--color-gray-300)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-(--color-gray-300)"
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
