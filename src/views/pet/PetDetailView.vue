<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const petId = route.params.id

const pet = ref(null)
const activeTab = ref('info')
const documents = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch pet detail by petId from pet store/API
  isLoading.value = false
})
</script>

<template>
  <div class="pet-detail-page">
    <header class="page-header">
      <router-link to="/pets" class="back-btn">&lsaquo; 목록</router-link>
      <h1>반려동물 상세</h1>
      <router-link :to="`/pets/${petId}/edit`" class="edit-btn">수정</router-link>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <template v-else-if="pet">
      <!-- Pet Profile Card -->
      <section class="profile-card card">
        <div class="profile-avatar">
          <!-- TODO: pet profile image -->
        </div>
        <h2 class="pet-name">{{ pet.name }}</h2>
        <p class="pet-meta">{{ pet.species }} &middot; {{ pet.breed }}</p>
        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">생년월일</span>
            <span class="detail-value">{{ pet.birthDate || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">성별</span>
            <span class="detail-value">{{ pet.gender === 'MALE' ? '수컷' : '암컷' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">체중</span>
            <span class="detail-value">{{ pet.weight ? `${pet.weight}kg` : '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">등록번호</span>
            <span class="detail-value">{{ pet.regNumber || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <nav class="tabs">
        <button
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          기본 정보
        </button>
        <button
          :class="{ active: activeTab === 'documents' }"
          @click="activeTab = 'documents'"
        >
          서류 관리
        </button>
      </nav>

      <!-- Tab Content: Info -->
      <section v-if="activeTab === 'info'" class="tab-content">
        <!-- TODO: implement additional pet info display -->
        <p class="placeholder-text">반려동물의 상세 정보가 여기에 표시됩니다.</p>
      </section>

      <!-- Tab Content: Documents -->
      <section v-if="activeTab === 'documents'" class="tab-content">
        <div v-if="documents.length === 0" class="empty-state">
          <p>등록된 서류가 없습니다.</p>
        </div>
        <ul v-else class="document-list">
          <li v-for="doc in documents" :key="doc.id" class="document-item card">
            <span class="doc-type">{{ doc.type }}</span>
            <span class="doc-name">{{ doc.name }}</span>
            <span class="doc-date">{{ doc.date }}</span>
          </li>
        </ul>
        <!-- TODO: implement document upload (registration cert, vaccine records) -->
        <button class="btn-outline">서류 업로드</button>
      </section>
    </template>

    <div v-else class="empty-state">
      <p>반려동물 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<style scoped>
.pet-detail-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.back-btn,
.edit-btn {
  font-size: var(--font-md);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.profile-card {
  text-align: center;
  margin-bottom: var(--space-5);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  margin: 0 auto var(--space-4);
}

.pet-name {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
}

.pet-meta {
  font-size: var(--font-md);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.profile-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
  text-align: left;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-label {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  font-weight: var(--font-medium);
}

.detail-value {
  font-size: var(--font-md);
  color: var(--color-gray-800);
  font-weight: var(--font-semibold);
}

.tabs {
  display: flex;
  border-bottom: 2px solid var(--color-gray-200);
  margin-bottom: var(--space-4);
}

.tabs button {
  flex: 1;
  padding: var(--space-3);
  border: none;
  background: none;
  font-size: var(--font-md);
  font-weight: var(--font-medium);
  color: var(--color-gray-500);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tabs button.active {
  color: var(--color-navy);
  border-bottom-color: var(--color-navy);
}

.tab-content {
  padding: var(--space-3) 0;
}

.placeholder-text {
  color: var(--color-gray-500);
  font-size: var(--font-md);
  text-align: center;
  padding: var(--space-6) 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-6) 0;
  color: var(--color-gray-500);
}

.document-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.document-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.doc-type {
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
  background-color: var(--color-gray-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.doc-name {
  flex: 1;
  font-size: var(--font-md);
  color: var(--color-gray-800);
}

.doc-date {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
}

.btn-outline {
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

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}
</style>
