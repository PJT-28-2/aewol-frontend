<script setup>
import { ref, onMounted } from 'vue'

const groupPurchases = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch open group purchases from store/API
  isLoading.value = false
})
</script>

<template>
  <div class="gp-list-page">
    <!-- 헤더 -->
    <header class="gp-header">
      <div class="gp-header__text">
        <h1>반려동물 용품 공동구매</h1>
        <p>함께 사면 더 저렴해요</p>
      </div>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <div v-else-if="groupPurchases.length === 0" class="empty-state">
      <p>현재 진행 중인 공동구매가 없습니다.</p>
    </div>

    <ul v-else class="gp-list">
      <li v-for="gp in groupPurchases" :key="gp.id">
        <router-link :to="`/group-purchase/${gp.id}`" class="gp-card card">
          <div class="gp-image">
            <!-- TODO: product image -->
          </div>
          <div class="gp-info">
            <h3>{{ gp.title }}</h3>
            <p class="gp-price">{{ gp.price?.toLocaleString() }}원</p>
            <div class="gp-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${(gp.currentCount / gp.targetCount) * 100}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ gp.currentCount }}/{{ gp.targetCount }}명</span>
            </div>
            <p class="gp-deadline">마감: {{ gp.deadline }}</p>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gp-list-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.gp-header {
  margin-bottom: var(--space-5);
}

.gp-header__text h1 {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.gp-header__text p {
  font-size: var(--font-sm);
  color: var(--color-slate-muted);
  margin-top: var(--space-1);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.gp-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.gp-card {
  display: flex;
  text-decoration: none;
  color: inherit;
}

.gp-image {
  width: 100px;
  height: 100px;
  background-color: var(--color-gray-200);
  flex-shrink: 0;
}

.gp-info {
  flex: 1;
  padding: var(--space-3) var(--space-4);
}

.gp-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-1);
}

.gp-price {
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin-bottom: var(--space-2);
}

.gp-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-gold);
  border-radius: var(--radius-full);
}

.progress-text {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  white-space: nowrap;
}

.gp-deadline {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
}
</style>
