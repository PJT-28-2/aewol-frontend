<script setup>
import { ref } from 'vue'

const form = ref({
  name: '',
  species: 'DOG',
  breed: '',
  birthDate: '',
  gender: 'MALE',
  weight: null,
  regNumber: '',
})
const isLoading = ref(false)
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

const handleSubmit = async () => {
  // TODO: implement pet registration with pet API
}
</script>

<template>
  <div class="pet-register-page">
    <header class="page-header">
      <h1>반려동물 등록</h1>
    </header>

    <form class="register-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">이름 *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="반려동물 이름"
          required
        />
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
        <input
          id="breed"
          v-model="form.breed"
          type="text"
          placeholder="예: 골든리트리버, 코리안숏헤어"
        />
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
        <input
          id="weight"
          v-model.number="form.weight"
          type="number"
          step="0.1"
          placeholder="체중"
        />
      </div>

      <div class="form-group">
        <label for="regNumber">동물등록번호</label>
        <input
          id="regNumber"
          v-model="form.regNumber"
          type="text"
          placeholder="동물등록번호 (선택)"
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '등록 중...' : '등록하기' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.pet-register-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
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

.register-form {
  max-width: 400px;
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
  margin-top: var(--space-4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
