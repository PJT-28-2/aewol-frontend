<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
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
          class="w-full max-w-[480px] mx-auto max-h-[50vh] bg-(--color-white) rounded-t-[32px] overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom,0)]"
        >
          <button
            type="button"
            class="flex justify-center w-full pt-(--space-3) shrink-0"
            aria-label="닫기"
            @click="close"
          >
            <span class="w-10 h-1 rounded-full bg-(--color-gray-300)" />
          </button>

          <h2
            v-if="title"
            class="shrink-0 px-(--space-5) pt-(--space-4) pb-(--space-2) text-(length:--font-lg) font-semibold text-(color:--color-gray-900)"
          >
            {{ title }}
          </h2>

          <div class="flex-1 min-h-0 px-(--space-5) pt-(--space-2) pb-(--space-6) overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
