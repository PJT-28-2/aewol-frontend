<script setup>
import { computed } from 'vue'
import { CATEGORY_CHART_PALETTE } from '@/utils/categoryChartPalette'

const props = defineProps({
  shares: {
    type: Array,
    required: true,
  },
  size: {
    type: Number,
    default: 108,
  },
})

const strokeWidth = 10
const radius = computed(() => props.size / 2 - strokeWidth)
const circumference = computed(() => 2 * Math.PI * radius.value)
const center = computed(() => props.size / 2)

const segments = computed(() => {
  let offset = 0
  return props.shares.map((share, index) => {
    const length = (share.percentage / 100) * circumference.value
    const segment = {
      color: CATEGORY_CHART_PALETTE[index % CATEGORY_CHART_PALETTE.length],
      dasharray: `${length} ${circumference.value}`,
      dashoffset: -offset,
    }
    offset += length
    return segment
  })
})

const topShare = computed(() => props.shares[0] ?? null)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    role="img"
    :aria-label="topShare ? `${topShare.label} ${topShare.percentage}%로 가장 큰 비중` : '카테고리별 지출 비중'"
  >
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      stroke="var(--color-surface)"
      :stroke-width="strokeWidth"
    />
    <circle
      v-for="(segment, index) in segments"
      :key="index"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke="segment.color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      :stroke-dasharray="segment.dasharray"
      :stroke-dashoffset="segment.dashoffset"
      :transform="`rotate(-90 ${center} ${center})`"
    />
    <text
      v-if="topShare"
      :x="center"
      :y="center - 3"
      text-anchor="middle"
      class="text-[19px] font-bold"
      fill="var(--color-navy)"
    >{{ topShare.percentage }}%</text>
    <text
      v-if="topShare"
      :x="center"
      :y="center + 15"
      text-anchor="middle"
      class="text-[11px] font-semibold"
      fill="var(--color-slate-muted)"
    >{{ topShare.label }}</text>
  </svg>
</template>
