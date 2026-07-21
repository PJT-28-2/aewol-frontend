<script setup>
import { ref, onMounted } from 'vue'

const pets = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch pet list from pet store/API
  isLoading.value = false
})
</script>

<template>
  <div class="pet-list-page">
    <header class="page-header">
      <h1>내 반려동물</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <!-- TODO: implement skeleton cards -->
      <p>로딩 중...</p>
    </div>

    <div v-else-if="pets.length === 0" class="empty-state">
      <div class="empty-icon"><!-- TODO: empty illustration --></div>
      <p>아직 등록된 반려동물이 없습니다.</p>
      <p class="empty-sub">반려동물을 등록하고 관리를 시작하세요!</p>
    </div>

    <ul v-else class="pet-list">
      <li v-for="pet in pets" :key="pet.id">
        <router-link :to="`/pets/${pet.id}`" class="pet-card card">
          <div class="pet-avatar">
            <!-- TODO: pet profile image -->
          </div>
          <div class="pet-info">
            <h3>{{ pet.name }}</h3>
            <p class="pet-meta">
              <span>{{ pet.species }}</span>
              <span v-if="pet.breed"> &middot; {{ pet.breed }}</span>
            </p>
            <p class="pet-detail">
              <span v-if="pet.gender">{{ pet.gender === 'MALE' ? '수컷' : '암컷' }}</span>
              <span v-if="pet.weight"> &middot; {{ pet.weight }}kg</span>
            </p>
          </div>
          <span class="chevron">&rsaquo;</span>
        </router-link>
      </li>
    </ul>

    <!-- FAB: Register New Pet -->
    <router-link to="/pets/register" class="fab" aria-label="반려동물 등록">
      +
    </router-link>
  </div>
</template>

<style scoped>
.pet-list-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-10));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.empty-state {
  text-align: center;
  padding: var(--space-10) 0;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  margin: 0 auto var(--space-5);
}

.empty-state p {
  font-size: var(--font-base);
  color: var(--color-gray-700);
}

.empty-sub {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-2);
}

.pet-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.pet-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  text-decoration: none;
  color: inherit;
}

.pet-avatar {
  width: 56px;
  height: 56px;
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
  color: var(--color-gray-600);
  margin-top: var(--space-1);
}

.pet-detail {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.chevron {
  font-size: var(--font-xl);
  color: var(--color-gray-400);
}

.fab {
  position: fixed;
  bottom: calc(var(--bottom-nav-height) + var(--space-5));
  right: var(--space-5);
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--color-gold);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  text-decoration: none;
  box-shadow: var(--shadow-lg);
}
</style>
