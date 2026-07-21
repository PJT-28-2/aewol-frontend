<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const petId = ref(route.params.id || '')

const pets = ref([])
const selectedPetData = ref({
  name: '',
  totalSpent: 0,
  categoryBreakdown: [],
  monthlyTrend: [],
})
const comparisonData = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch pet list and selected pet spending data
  isLoading.value = false
})

const handlePetChange = async () => {
  // TODO: re-fetch data for selected pet
}
</script>

<template>
  <div class="pet-dashboard-page">
    <header class="page-header">
      <h1>반려동물별 지출</h1>
    </header>

    <!-- Pet Selector -->
    <div class="pet-selector">
      <select v-model="petId" @change="handlePetChange" class="pet-select">
        <option value="" disabled>반려동물 선택</option>
        <option v-for="pet in pets" :key="pet.id" :value="pet.id">
          {{ pet.name }}
        </option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <template v-else-if="petId">
      <!-- Spending Summary -->
      <section class="spending-summary card">
        <h2>{{ selectedPetData.name }} 총 지출</h2>
        <p class="total-amount">{{ selectedPetData.totalSpent.toLocaleString() }}원</p>
      </section>

      <!-- Category Breakdown -->
      <section class="chart-section card">
        <h2>카테고리별 분석</h2>
        <div class="chart-placeholder">
          <!-- TODO: implement category breakdown chart -->
          <div class="bar-placeholder"></div>
          <p class="placeholder-text">카테고리 차트 영역</p>
        </div>
        <ul class="breakdown-list">
          <li v-for="cat in selectedPetData.categoryBreakdown" :key="cat.category">
            <span class="cat-name">{{ cat.category }}</span>
            <span class="cat-amount">{{ cat.amount?.toLocaleString() }}원</span>
          </li>
        </ul>
      </section>

      <!-- Monthly Trend -->
      <section class="chart-section card">
        <h2>월별 추이</h2>
        <div class="chart-placeholder">
          <!-- TODO: implement monthly trend line chart -->
          <div class="line-placeholder"></div>
          <p class="placeholder-text">월별 지출 추이 차트 영역</p>
        </div>
      </section>

      <!-- Comparison with Other Pets -->
      <section v-if="comparisonData" class="comparison-section card">
        <h2>반려동물 비교</h2>
        <!-- TODO: implement comparison bar chart -->
        <div class="chart-placeholder">
          <div class="bar-placeholder"></div>
          <p class="placeholder-text">비교 차트 영역</p>
        </div>
      </section>
    </template>

    <div v-else class="empty-state">
      <p>위에서 반려동물을 선택하세요.</p>
    </div>
  </div>
</template>

<style scoped>
.pet-dashboard-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-4);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.pet-selector {
  margin-bottom: var(--space-5);
}

.pet-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  background-color: var(--color-white);
  color: var(--color-gray-700);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.spending-summary {
  margin-bottom: var(--space-5);
  text-align: center;
}

.spending-summary h2 {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  font-weight: var(--font-medium);
}

.total-amount {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin-top: var(--space-2);
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
  padding: var(--space-5) 0;
}

.bar-placeholder {
  width: 100%;
  height: 100px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-gray-200) 0px,
    var(--color-gray-200) 30px,
    transparent 30px,
    transparent 40px
  );
  border-radius: var(--radius-md);
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

.breakdown-list {
  list-style: none;
  padding: 0;
  margin: var(--space-4) 0 0;
}

.breakdown-list li {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-gray-100);
}

.cat-name {
  font-size: var(--font-sm);
  color: var(--color-gray-700);
}

.cat-amount {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}

.comparison-section {
  margin-bottom: var(--space-5);
}

.comparison-section h2 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}
</style>
