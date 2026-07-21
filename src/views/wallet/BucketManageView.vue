<script setup>
import { ref, onMounted } from 'vue'

const bucketsByPet = ref({})
const isLoading = ref(true)
const showModal = ref(false)
const editingBucket = ref(null)

const modalForm = ref({
  name: '',
  petId: '',
  goalAmount: null,
})

onMounted(async () => {
  // TODO: fetch buckets grouped by pet from wallet store/API
  isLoading.value = false
})

const openCreateModal = () => {
  editingBucket.value = null
  modalForm.value = { name: '', petId: '', goalAmount: null }
  showModal.value = true
}

const openEditModal = (bucket) => {
  editingBucket.value = bucket
  modalForm.value = {
    name: bucket.name,
    petId: bucket.petId,
    goalAmount: bucket.goalAmount,
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingBucket.value = null
}

const handleSave = async () => {
  // TODO: implement create or update bucket
  closeModal()
}
</script>

<template>
  <div class="bucket-manage-page">
    <header class="page-header">
      <router-link to="/wallet" class="back-btn">&lsaquo; 지갑</router-link>
      <h1>버킷 관리</h1>
      <button class="btn-add" @click="openCreateModal">+ 추가</button>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <div v-else-if="Object.keys(bucketsByPet).length === 0" class="empty-state">
      <p>아직 버킷이 없습니다.</p>
      <button class="btn-primary" @click="openCreateModal">첫 번째 버킷 만들기</button>
    </div>

    <div v-else class="bucket-groups">
      <section v-for="(buckets, petName) in bucketsByPet" :key="petName" class="pet-group">
        <h2 class="group-title">{{ petName }}</h2>
        <ul class="bucket-list">
          <li v-for="bucket in buckets" :key="bucket.id" class="bucket-card card">
            <div class="bucket-info">
              <h3>{{ bucket.name }}</h3>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${bucket.goalAmount ? (bucket.balance / bucket.goalAmount) * 100 : 0}%` }"
                ></div>
              </div>
              <p class="bucket-progress">
                {{ bucket.balance?.toLocaleString() }}원
                <span v-if="bucket.goalAmount"> / {{ bucket.goalAmount.toLocaleString() }}원</span>
              </p>
            </div>
            <button class="btn-edit" @click="openEditModal(bucket)">수정</button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <h2>{{ editingBucket ? '버킷 수정' : '버킷 만들기' }}</h2>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label for="bucketName">버킷 이름</label>
            <input
              id="bucketName"
              v-model="modalForm.name"
              type="text"
              placeholder="예: 의료비, 간식비"
              required
            />
          </div>
          <div class="form-group">
            <label for="goalAmount">목표 금액 (선택)</label>
            <input
              id="goalAmount"
              v-model.number="modalForm.goalAmount"
              type="number"
              placeholder="목표 금액"
            />
          </div>
          <!-- TODO: implement pet selection dropdown -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">취소</button>
            <button type="submit" class="btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bucket-manage-page {
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

.btn-add {
  font-size: var(--font-sm);
  color: var(--color-gold);
  font-weight: var(--font-semibold);
  background: none;
  border: none;
  cursor: pointer;
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

.btn-primary {
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
  margin-top: var(--space-3);
}

.pet-group {
  margin-bottom: var(--space-6);
}

.group-title {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-3);
  padding-left: var(--space-1);
}

.bucket-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bucket-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bucket-info {
  flex: 1;
}

.bucket-info h3 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.progress-bar {
  height: 6px;
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

.bucket-progress {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
}

.bucket-progress span {
  color: var(--color-gray-400);
}

.btn-edit {
  font-size: var(--font-sm);
  color: var(--color-navy);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: var(--font-medium);
  margin-left: var(--space-4);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal {
  width: 100%;
  max-width: 400px;
}

.modal h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin-bottom: var(--space-5);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-1);
}

.form-group input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.btn-cancel {
  flex: 1;
  padding: var(--space-3);
  background: none;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-gray-600);
  cursor: pointer;
}

.modal-actions .btn-primary {
  flex: 1;
  margin-top: 0;
}
</style>
