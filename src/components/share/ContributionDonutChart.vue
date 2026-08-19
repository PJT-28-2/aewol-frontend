<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PieChart } from 'echarts/charts'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, CanvasRenderer])

const props = defineProps({
  contributions: {
    type: Array,
    default: () => [],
  },
})

const chartElement = ref(null)
let chart

function getColor(token) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
}

function renderChart() {
  if (!chart) return

  chart.setOption(
    {
      animation: false,
      series: [
        {
          type: 'pie',
          radius: ['64%', '100%'],
          avoidLabelOverlap: true,
          silent: true,
          itemStyle: {
            borderColor: getColor('--color-white'),
            borderWidth: 3,
            borderRadius: 2,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            scale: false,
          },
          data: props.contributions.map((contribution) => ({
            value: contribution.percentage,
            name: contribution.name,
            itemStyle: {
              color: getColor(contribution.colorToken),
            },
          })),
        },
      ],
    },
    true,
  )
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  chart = init(chartElement.value)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch(
  () => props.contributions,
  () => renderChart(),
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>

<template>
  <div
    ref="chartElement"
    class="size-[var(--share-chart-size)]"
    role="img"
    aria-label="이번 달 가족별 지출 기여 비율"
  />
</template>
