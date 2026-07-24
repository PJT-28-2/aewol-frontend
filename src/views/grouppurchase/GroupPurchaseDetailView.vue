<script setup>
import { ref, onMounted } from 'vue'

const groupPurchase = ref(null)
const participants = ref([])
const isLoading = ref(true)
const isJoining = ref(false)
const hasJoined = ref(false)

onMounted(async () => {
  // TODO: fetch group purchase detail and participants
  isLoading.value = false
})

const handleJoin = async () => {
  // TODO: implement join group purchase
}

const handleLeave = async () => {
  // TODO: implement leave group purchase
}
</script>

<template>
  <div class="gp-detail-page">
    <header class="page-header">
      <router-link to="/group-purchase" class="back-btn">&lsaquo; 목록</router-link>
      <h1>공동구매 상세</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <template v-else-if="groupPurchase">
      <!-- Product Info -->
      <section class="product-section">
        <div class="product-image">
          <!-- TODO: product image -->
        </div>
        <div class="product-info card">
          <h2>{{ groupPurchase.title }}</h2>
          <p class="product-price">{{ groupPurchase.price?.toLocaleString() }}원</p>
          <p class="product-description">{{ groupPurchase.description }}</p>

          <div class="progress-section">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(groupPurchase.currentCount / groupPurchase.targetCount) * 100}%` }"
              ></div>
            </div>
            <p class="progress-text">
              {{ groupPurchase.currentCount }} / {{ groupPurchase.targetCount }}명 참여
            </p>
          </div>

          <p class="deadline">마감일: {{ groupPurchase.deadline }}</p>
        </div>
      </section>

      <!-- Participants -->
      <section class="participants-section">
        <h2>참여자 ({{ participants.length }}명)</h2>
        <ul class="participant-list">
          <li v-for="p in participants" :key="p.id" class="participant-item">
            <div class="participant-avatar"><!-- TODO: avatar --></div>
            <span class="participant-name">{{ p.name }}</span>
          </li>
        </ul>
      </section>

      <!-- Join/Leave Button -->
      <div class="action-area">
        <button
          v-if="!hasJoined"
          class="btn-join"
          :disabled="isJoining"
          @click="handleJoin"
        >
          {{ isJoining ? '참여 중...' : '참여하기' }}
        </button>
        <button
          v-else
          class="btn-leave"
          @click="handleLeave"
        >
          참여 취소
        </button>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>공동구매 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<style scoped>
.gp-detail-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-8));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.back-btn {
  font-size: var(--font-md);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.page-header h1 {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
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

.product-image {
  width: 100%;
  height: 200px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.product-info {
  margin-bottom: var(--space-5);
}

.product-info h2 {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.product-price {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}

.product-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--space-5);
}

.progress-section {
  margin-bottom: var(--space-3);
}

.progress-bar {
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-2);
}

.progress-fill {
  height: 100%;
  background-color: var(--color-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  font-weight: var(--font-medium);
}

.deadline {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.participants-section {
  margin-bottom: var(--space-6);
}

.participants-section h2 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}

.participant-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.participant-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
}

.participant-name {
  font-size: var(--font-sm);
  color: var(--color-gray-700);
}

.action-area {
  position: fixed;
  bottom: var(--bottom-nav-height);
  left: 0;
  right: 0;
  padding: var(--space-4);
  background-color: var(--color-white);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.btn-join {
  width: 100%;
  padding: var(--space-4);
  background-color: var(--color-gold);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  cursor: pointer;
}

.btn-join:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-leave {
  width: 100%;
  padding: var(--space-4);
  background-color: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}
</style>
