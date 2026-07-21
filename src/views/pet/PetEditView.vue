<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const petId = route.params.id

const form = ref({
  name: '',
  species: 'DOG',
  breed: '',
  birthDate: '',
  gender: 'MALE',
  weight: null,
  regNumber: '',
})
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')

const speciesOptions = [
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
  { value: 'ETC', label: '기타' },
]

const genderOptions = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
]

onMounted(async () => {
  // TODO: fetch existing pet data and populate form
  isLoading.value = false
})

const handleUpdate = async () => {
  // TODO: implement pet update with pet API
}

const handleDelete = async () => {
  // TODO: implement pet deletion with confirmation
}
</script>

<template>
  <div class="pet-edit-page">
    <header class="page-header">
      <router-link :to="`/pets/${petId}`" class="back-btn">&lsaquo; 돌아가기</router-link>
      <h1>반려동물 수정</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <form v-else class="edit-form" @submit.prevent="handleUpdate">
      <div class="form-group">
        <label for="name">이름 *</label>
        <input id="name" v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label for="species">종류 *</label>
        <select id="species" v-model="form.species" required>
          <option v-for="opt in speciesOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="breed">품종</label>
        <input id="breed" v-model="form.breed" type="text" />
      </div>

      <div class="form-group">
        <label for="birthDate">생년월일</label>
        <input id="birthDate" v-model="form.birthDate" type="date" />
      </div>

      <div class="form-group">
        <label>성별</label>
        <div class="radio-group">
          <label v-for="opt in genderOptions" :key="opt.value" class="radio-label">
            <input type="radio" v-model="form.gender" :value="opt.value" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="weight">체중 (kg)</label>
        <input id="weight" v-model.number="form.weight" type="number" step="0.1" />
      </div>

      <div class="form-group">
        <label for="regNumber">동물등록번호</label>
        <input id="regNumber" v-model="form.regNumber" type="text" />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="action-buttons">
        <button type="submit" class="btn-primary" :disabled="isSaving">
          {{ isSaving ? '저장 중...' : '저장하기' }}
        </button>
        <button type="button" class="btn-danger" @click="handleDelete">
          삭제하기
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.pet-edit-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
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

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.edit-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group > label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-1);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
  background-color: var(--color-white);
}

.radio-group {
  display: flex;
  gap: var(--space-5);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-base);
  color: var(--color-gray-700);
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: auto;
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-sm);
  margin-bottom: var(--space-3);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.btn-primary {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: var(--font-medium);
  cursor: pointer;
}
</style>
