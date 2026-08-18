<script setup>
import { computed } from 'vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'

const props = defineProps({
  variant: { type: String, default: 'success' },
  size: { type: [String, Number], default: 112 },
})

const config = computed(() => ({
  success: { icon: IconCheck, outer: 'var(--color-leaf-soft)', inner: 'var(--color-leaf)', foreground: 'var(--color-navy)' },
  warning: { icon: IconWarning, outer: 'color-mix(in srgb, var(--color-chart-amber) 22%, var(--color-white))', inner: 'var(--color-chart-amber)', foreground: 'var(--color-navy)' },
  danger: { icon: IconWarning, outer: 'color-mix(in srgb, var(--color-navy) 6%, var(--color-white))', inner: 'color-mix(in srgb, var(--color-navy) 14%, var(--color-white))', foreground: 'var(--color-navy)' },
  cancel: { icon: IconClose, outer: 'var(--color-gray-200)', inner: 'var(--color-gray-400)', foreground: 'var(--color-navy)' },
  info: { icon: IconInfo, outer: 'var(--color-leaf-soft)', inner: 'var(--color-leaf)', foreground: 'var(--color-navy)' },
}[props.variant] ?? { icon: IconInfo, outer: 'var(--color-leaf-soft)', inner: 'var(--color-leaf)', foreground: 'var(--color-navy)' }))

const visualSize = computed(() => `${Number(props.size)}px`)
const innerSize = computed(() => `${Math.round(Number(props.size) * 0.5)}px`)
const iconSize = computed(() => Math.round(Number(props.size) * 0.28))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full"
    :style="{ width: visualSize, height: visualSize, backgroundColor: config.outer, color: config.foreground }"
    aria-hidden="true"
  >
    <span
      class="inline-flex items-center justify-center rounded-full"
      :style="{ width: innerSize, height: innerSize, backgroundColor: config.inner }"
    >
      <component
        :is="config.icon"
        :size="iconSize"
        color="currentColor"
      />
    </span>
  </span>
</template>
