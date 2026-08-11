<script setup>
import IconPaw from './icons/IconPaw.vue'

defineProps({
  size: { type: [Number, String], default: 24 },
  color: { type: String, default: 'var(--color-navy)' },
  pawColor: { type: String, default: 'var(--color-leaf)' },
})
</script>

<template>
  <span
    class="inline-flex items-center font-bold tracking-[-0.055em]"
    :style="{ color, fontSize: `${size}px`, lineHeight: 1 }"
    aria-label="AEWOL"
  >
    <span>AEW</span>
    <IconPaw
      class="mx-[0.06em]"
      :size="Number(size) * 0.78"
      :color="pawColor"
      filled
    />
    <span>L</span>
  </span>
</template>
