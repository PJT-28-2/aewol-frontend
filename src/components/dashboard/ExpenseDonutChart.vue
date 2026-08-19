<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PieChart } from 'echarts/charts';
import { init, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

use([PieChart, CanvasRenderer]);

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  size: {
    type: String,
    default: 'var(--dashboard-chart-size)',
  },
});

const chartElement = ref(null);
let chart;

function getColor(token) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

function renderChart() {
  if (!chart) return;

  chart.setOption(
    {
      animation: false,
      series: [
        {
          type: 'pie',
          radius: ['70%', '96%'],
          avoidLabelOverlap: true,
          silent: true,
          itemStyle: {
            borderColor: getColor('--color-white'),
            borderWidth: 2,
            borderRadius: 6,
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
          data: props.items.map((item) => ({
            value: item.percentage,
            name: item.label,
            itemStyle: {
              color: getColor(item.colorToken),
            },
          })),
        },
      ],
    },
    true,
  );
}

function resizeChart() {
  chart?.resize();
}

onMounted(() => {
  chart = init(chartElement.value);
  renderChart();
  window.addEventListener('resize', resizeChart);
});

watch(
  () => props.items,
  () => renderChart(),
  { deep: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});
</script>

<template>
  <div
    ref="chartElement"
    :style="{ width: size, height: size }"
    role="img"
    aria-label="이번 달 지출 비율"
  />
</template>
