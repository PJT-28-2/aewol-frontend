<script setup>
import { ref, onMounted } from 'vue'

const programs = ref([])
const isLoading = ref(true)
const regionFilter = ref('')

onMounted(async () => {
  // TODO: fetch matched support programs from support store/API
  isLoading.value = false
})
</script>

<template>
  <div class="support-page">
    <header class="page-header">
      <h1>지자체 지원</h1>
      <p class="page-description">내 반려동물에 매칭된 지원 프로그램을 확인하세요.</p>
    </header>

    <!-- Region Filter -->
    <div class="filter-section">
      <select v-model="regionFilter" class="region-select">
        <option value="">전체 지역</option>
        <!-- TODO: populate with regions from API -->
        <option value="SEOUL">서울특별시</option>
        <option value="GYEONGGI">경기도</option>
        <option value="BUSAN">부산광역시</option>
        <option value="INCHEON">인천광역시</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <div v-else-if="programs.length === 0" class="empty-state">
      <p>현재 매칭된 지원 프로그램이 없습니다.</p>
    </div>

    <ul v-else class="program-list">
      <li v-for="program in programs" :key="program.id" class="program-item card">
        <div class="program-header">
          <span class="program-region">{{ program.region }}</span>
          <span v-if="program.isNew" class="new-badge">NEW</span>
        </div>
        <h3>{{ program.title }}</h3>
        <p class="program-description">{{ program.description }}</p>
        <div class="program-details">
          <div class="detail-item">
            <span class="detail-label">지원 금액</span>
            <span class="detail-value">{{ program.supportAmount?.toLocaleString() }}원</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">신청 기간</span>
            <span class="detail-value">{{ program.period }}</span>
          </div>
        </div>
        <!-- TODO: implement application link/button -->
        <button class="btn-apply">신청 안내 보기</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.support-page {
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

.page-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-2);
}

.filter-section {
  margin-bottom: var(--space-5);
}

.region-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
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

.program-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.program-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.program-region {
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  color: var(--color-navy-light);
  background-color: var(--color-gray-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.new-badge {
  font-size: var(--font-xs);
  font-weight: var(--font-bold);
  color: var(--color-danger);
}

.program-item h3 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.program-description {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  line-height: 1.5;
  margin-bottom: var(--space-4);
}

.program-details {
  display: flex;
  gap: var(--space-5);
  margin-bottom: var(--space-4);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-label {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
}

.detail-value {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}

.btn-apply {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-navy);
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-navy);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
}
</style>
