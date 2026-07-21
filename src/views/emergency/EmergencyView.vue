<script setup>
import { ref, onMounted } from 'vue'

const hospitals = ref([])
const isLoading = ref(true)
const is24hOnly = ref(false)
const userLocation = ref(null)

onMounted(async () => {
  // TODO: get user's current location via Geolocation API
  // TODO: fetch nearby emergency hospitals
  isLoading.value = false
})

const handleFilter24h = () => {
  // TODO: filter hospitals by 24h availability
}

const handleCall = (phone) => {
  window.location.href = `tel:${phone}`
}
</script>

<template>
  <div class="emergency-page">
    <header class="page-header">
      <h1>응급 동물병원</h1>
    </header>

    <!-- 24h Filter -->
    <div class="filter-bar">
      <label class="toggle-label">
        <input type="checkbox" v-model="is24hOnly" @change="handleFilter24h" />
        <span class="toggle-text">24시간 진료만 보기</span>
      </label>
    </div>

    <!-- Map Placeholder -->
    <section class="map-section card">
      <div class="map-placeholder">
        <!-- TODO: implement map (Kakao Maps / Naver Maps API) -->
        <p class="placeholder-text">지도 영역</p>
        <p class="placeholder-sub">주변 응급 동물병원이 표시됩니다.</p>
      </div>
    </section>

    <!-- Hospital List -->
    <section class="hospital-section">
      <h2>주변 병원 목록</h2>

      <div v-if="isLoading" class="loading-state">
        <p>위치 정보를 가져오는 중...</p>
      </div>

      <div v-else-if="hospitals.length === 0" class="empty-state">
        <p>주변에 응급 동물병원이 없습니다.</p>
      </div>

      <ul v-else class="hospital-list">
        <li v-for="hospital in hospitals" :key="hospital.id" class="hospital-item card">
          <div class="hospital-info">
            <div class="hospital-header">
              <h3>{{ hospital.name }}</h3>
              <span v-if="hospital.is24h" class="badge-24h">24시</span>
            </div>
            <p class="hospital-address">{{ hospital.address }}</p>
            <p class="hospital-distance">{{ hospital.distance }}km</p>
          </div>
          <button class="btn-call" @click="handleCall(hospital.phone)">
            전화
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.emergency-page {
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
  color: var(--color-danger);
}

.filter-bar {
  margin-bottom: var(--space-4);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.toggle-text {
  font-size: var(--font-md);
  color: var(--color-gray-700);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.map-section {
  margin-bottom: var(--space-5);
}

.map-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
}

.placeholder-text {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-400);
}

.placeholder-sub {
  font-size: var(--font-sm);
  color: var(--color-gray-400);
  margin-top: var(--space-2);
}

.hospital-section h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-6) 0;
  color: var(--color-gray-500);
}

.hospital-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hospital-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hospital-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.hospital-header h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.badge-24h {
  font-size: var(--font-xs);
  font-weight: var(--font-bold);
  color: var(--color-danger);
  background-color: #fce4ec;
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
}

.hospital-address {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
}

.hospital-distance {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
  margin-top: var(--space-1);
}

.btn-call {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-success);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  white-space: nowrap;
}
</style>
