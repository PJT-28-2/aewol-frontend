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
    class="inline-flex items-center tracking-[-0.02em]"
    :style="{ color, fontSize: `${size}px`, lineHeight: 1, fontFamily: 'var(--font-logo)', fontWeight: 800 }"
    aria-label="AEWOL"
  >
    <span>AEW</span>
    <IconPaw
      class="-mx-[0.05em]"
      :size="Number(size)"
      :color="pawColor"
      filled
    />
    <span>L</span>
  </span>
</template>
