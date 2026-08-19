<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  length: {
    type: Number,
    default: 6,
  },
})
</script>

<template>
  <div class="flex items-center justify-center gap-(--space-2)">
    <span
      v-for="index in length"
      :key="index"
      class="w-3.5 h-3.5 rounded-full"
      :class="
        index <= modelValue.length
          ? 'bg-(--color-navy)'
          : 'border border-(--color-border)'
      "
    />
  </div>
</template>
