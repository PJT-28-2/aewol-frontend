<script setup>
import { ref, onMounted } from 'vue'

const walletSummary = ref({
  totalBalance: 0,
  bucketCount: 0,
})
const pets = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch wallet summary and pet list from stores/API
  isLoading.value = false
})
</script>

<template>
  <div class="home-page">
    <header class="page-header">
      <h1>애월</h1>
      <p class="greeting">안녕하세요! 오늘도 반려동물과 함께하세요.</p>
    </header>

    <!-- Wallet Summary Card -->
    <section class="wallet-summary card">
      <h2>내 지갑</h2>
      <p class="balance">{{ walletSummary.totalBalance.toLocaleString() }}원</p>
      <p class="bucket-count">버킷 {{ walletSummary.bucketCount }}개</p>
      <div class="wallet-actions">
        <router-link to="/wallet" class="btn-outline">상세보기</router-link>
      </div>
    </section>

    <!-- Pet List Cards -->
    <section class="pet-section">
      <div class="section-header">
        <h2>내 반려동물</h2>
        <router-link to="/pets/register" class="btn-add">+ 등록</router-link>
      </div>

      <div v-if="isLoading" class="loading-placeholder">
        <!-- TODO: implement skeleton loader -->
        <p>로딩 중...</p>
      </div>

      <div v-else-if="pets.length === 0" class="empty-state">
        <p>등록된 반려동물이 없습니다.</p>
        <router-link to="/pets/register" class="btn-primary">반려동물 등록하기</router-link>
      </div>

      <div v-else class="pet-cards">
        <div v-for="pet in pets" :key="pet.id" class="pet-card card">
          <div class="pet-avatar">
            <!-- TODO: pet avatar image -->
          </div>
          <div class="pet-info">
            <h3>{{ pet.name }}</h3>
            <p class="pet-meta">{{ pet.species }} &middot; {{ pet.breed }}</p>
          </div>
          <router-link :to="`/pets/${pet.id}`" class="btn-detail">상세</router-link>
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="quick-actions">
      <h2>빠른 메뉴</h2>
      <div class="action-grid">
        <router-link to="/payment" class="action-item card">
          <span class="action-icon"><!-- TODO: icon --></span>
          <span>결제</span>
        </router-link>
        <router-link to="/dashboard" class="action-item card">
          <span class="action-icon"><!-- TODO: icon --></span>
          <span>통계</span>
        </router-link>
        <router-link to="/insurance/simulator" class="action-item card">
          <span class="action-icon"><!-- TODO: icon --></span>
          <span>보험</span>
        </router-link>
        <router-link to="/emergency" class="action-item card">
          <span class="action-icon"><!-- TODO: icon --></span>
          <span>응급</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.greeting {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-1);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.wallet-summary {
  margin-bottom: var(--space-6);
}

.wallet-summary h2 {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  font-weight: var(--font-medium);
}

.balance {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin: var(--space-2) 0;
}

.bucket-count {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.wallet-actions {
  margin-top: var(--space-4);
}

.btn-outline {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-navy);
  border-radius: var(--radius-md);
  color: var(--color-navy);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.pet-section {
  margin-bottom: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
}

.btn-add {
  font-size: var(--font-sm);
  color: var(--color-gold);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.empty-state {
  text-align: center;
  padding: var(--space-7) 0;
  color: var(--color-gray-500);
}

.btn-primary {
  display: inline-block;
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.pet-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pet-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.pet-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  flex-shrink: 0;
}

.pet-info {
  flex: 1;
}

.pet-info h3 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.pet-meta {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.btn-detail {
  font-size: var(--font-sm);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.quick-actions {
  margin-bottom: var(--space-6);
}

.quick-actions h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  text-decoration: none;
  color: var(--color-gray-700);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-navy-light);
  opacity: 0.1;
}

.loading-placeholder {
  text-align: center;
  padding: var(--space-5);
  color: var(--color-gray-500);
}
</style>
