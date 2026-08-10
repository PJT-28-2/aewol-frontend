<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  tone: {
    type: String,
    default: 'green',
    validator: (value) => ['green', 'blue', 'pink', 'yellow', 'purple', 'gray'].includes(value),
  },
})

const toneClasses = {
  green: 'bg-(--color-icon-green-soft) text-(--color-icon-green)',
  blue: 'bg-(--color-icon-blue-soft) text-(--color-icon-blue)',
  pink: 'bg-(--color-icon-pink-soft) text-(--color-icon-pink)',
  yellow: 'bg-(--color-icon-yellow-soft) text-(--color-icon-yellow)',
  purple: 'bg-(--color-icon-purple-soft) text-(--color-icon-purple)',
  gray: 'bg-(--color-icon-gray-soft) text-(--color-icon-gray)',
}
</script>

<template>
  <span
    class="inline-flex size-[48px] shrink-0 items-center justify-center"
    aria-hidden="true"
  >
    <span
      class="flex size-[40px] items-center justify-center rounded-full"
      :class="toneClasses[tone]"
    >
      <component
        :is="icon"
        :size="24"
        color="currentColor"
        filled
        tile
      />
    </span>
  </span>
</template>
