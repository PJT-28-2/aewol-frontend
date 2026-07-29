<script setup>
import { ref, onMounted } from 'vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const monthlySummary = ref({
  totalSpent: 0,
  totalIncome: 0,
  categoryBreakdown: [],
  dailyTrend: [],
})
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch monthly dashboard data from dashboard store/API
  isLoading.value = false
})

const handleMonthChange = async () => {
  // TODO: re-fetch data for selected month
}
</script>

<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h1>지출 통계</h1>
      <input
        v-model="selectedMonth"
        type="month"
        class="month-picker"
        @change="handleMonthChange"
      >
    </header>

    <div
      v-if="isLoading"
      class="loading-state"
    >
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- Monthly Summary -->
      <section class="summary-cards">
        <div class="summary-card card">
          <p class="summary-label">
            총 지출
          </p>
          <p class="summary-value expense">
            {{ monthlySummary.totalSpent.toLocaleString() }}원
          </p>
        </div>
        <div class="summary-card card">
          <p class="summary-label">
            총 수입
          </p>
          <p class="summary-value income">
            {{ monthlySummary.totalIncome.toLocaleString() }}원
          </p>
        </div>
      </section>

      <!-- Category Breakdown Pie Chart -->
      <section class="chart-section card">
        <h2>카테고리별 지출</h2>
        <div class="chart-placeholder">
          <!-- TODO: implement pie chart (e.g., Chart.js or ECharts) -->
          <div class="pie-placeholder" />
          <p class="placeholder-text">
            파이 차트 영역
          </p>
        </div>
        <ul class="category-legend">
          <li
            v-for="cat in monthlySummary.categoryBreakdown"
            :key="cat.category"
          >
            <span
              class="legend-dot"
              :style="{ backgroundColor: cat.color }"
            />
            <span class="legend-label">{{ cat.category }}</span>
            <span class="legend-value">{{ cat.amount?.toLocaleString() }}원</span>
          </li>
        </ul>
      </section>

      <!-- Trend Line Chart -->
      <section class="chart-section card">
        <h2>일별 지출 추이</h2>
        <div class="chart-placeholder">
          <!-- TODO: implement line chart (e.g., Chart.js or ECharts) -->
          <div class="line-placeholder" />
          <p class="placeholder-text">
            라인 차트 영역
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.month-picker {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--color-gray-700);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.summary-label {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.summary-value {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  margin-top: var(--space-2);
}

.summary-value.expense {
  color: var(--color-danger);
}

.summary-value.income {
  color: var(--color-success);
}

.chart-section {
  margin-bottom: var(--space-5);
}

.chart-section h2 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) 0;
}

.pie-placeholder {
  width: 160px;
  height: 160px;
  border-radius: var(--radius-full);
  border: 16px solid var(--color-gray-200);
  border-top-color: var(--color-navy);
  border-right-color: var(--color-gold);
  margin-bottom: var(--space-3);
}

.line-placeholder {
  width: 100%;
  height: 120px;
  background: linear-gradient(
    to right,
    var(--color-gray-200) 0%,
    var(--color-gray-300) 50%,
    var(--color-gray-200) 100%
  );
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}

.placeholder-text {
  font-size: var(--font-sm);
  color: var(--color-gray-400);
}

.category-legend {
  list-style: none;
  padding: 0;
  margin: var(--space-4) 0 0;
}

.category-legend li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-gray-100);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--color-gray-700);
}

.legend-value {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}
</style>
