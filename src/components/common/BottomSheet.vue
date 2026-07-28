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
        class="fixed inset-0 z-1000 flex items-end bg-black/50"
        @click="onOverlayClick"
      >
        <div
          ref="sheetRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          class="w-full max-w-(--layout-max-width) mx-auto bg-(--color-white) rounded-t-(--radius-sheet) overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom,0)] outline-none"
          :class="maxHeightClasses[size]"
          @keydown="onKeydown"
        >
          <button
            type="button"
            class="flex justify-center w-full pt-(--space-3) shrink-0"
            aria-label="닫기"
            @click="close"
          >
            <span
              class="w-10 h-1 rounded-full bg-(--color-gray-300)"
            />
          </button>

          <h2
            v-if="title"
            :id="titleId"
            class="shrink-0 px-(--space-5) pt-(--space-4) pb-(--space-2) text-(length:--font-lg) font-semibold text-(color:--color-gray-900)"
          >
            {{ title }}
          </h2>

          <div
            class="flex-1 min-h-0 px-(--space-5) pt-(--space-2) pb-(--space-6) overflow-y-auto"
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
