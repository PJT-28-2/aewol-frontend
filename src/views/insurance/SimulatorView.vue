<script setup>
import { ref } from 'vue'

const form = ref({
  breed: '',
  age: null,
  species: 'DOG',
  medicalHistory: [],
})
const result = ref(null)
const isLoading = ref(false)

const medicalOptions = [
  { value: 'NONE', label: '없음' },
  { value: 'ALLERGY', label: '알레르기' },
  { value: 'JOINT', label: '관절 질환' },
  { value: 'SKIN', label: '피부 질환' },
  { value: 'DENTAL', label: '치과 질환' },
  { value: 'DIGESTIVE', label: '소화기 질환' },
  { value: 'OTHER', label: '기타' },
]

const handleSimulate = async () => {
  // TODO: implement insurance simulation API call
}

const handleReset = () => {
  result.value = null
  form.value = { breed: '', age: null, species: 'DOG', medicalHistory: [] }
}
</script>

<template>
  <div class="simulator-page">
    <header class="page-header">
      <h1>보험 시뮬레이션</h1>
      <p class="page-description">반려동물 정보를 입력하고 예상 보험료를 확인하세요.</p>
    </header>

    <!-- Simulation Form -->
    <form v-if="!result" class="simulator-form" @submit.prevent="handleSimulate">
      <div class="form-group">
        <label>종류</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="form.species" value="DOG" />
            강아지
          </label>
          <label class="radio-label">
            <input type="radio" v-model="form.species" value="CAT" />
            고양이
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="breed">품종</label>
        <input
          id="breed"
          v-model="form.breed"
          type="text"
          placeholder="예: 골든리트리버"
          required
        />
      </div>

      <div class="form-group">
        <label for="age">나이 (세)</label>
        <input
          id="age"
          v-model.number="form.age"
          type="number"
          min="0"
          max="30"
          placeholder="나이"
          required
        />
      </div>

      <div class="form-group">
        <label>과거 병력</label>
        <div class="checkbox-group">
          <label v-for="opt in medicalOptions" :key="opt.value" class="checkbox-label">
            <input type="checkbox" :value="opt.value" v-model="form.medicalHistory" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '계산 중...' : '시뮬레이션 실행' }}
      </button>
    </form>

    <!-- Result Display -->
    <section v-if="result" class="result-section">
      <div class="result-card card">
        <h2>시뮬레이션 결과</h2>
        <div class="result-summary">
          <p class="result-label">예상 월 보험료</p>
          <p class="result-amount">{{ result.monthlyPremium?.toLocaleString() }}원</p>
        </div>
        <div class="result-details">
          <div class="detail-row">
            <span>보장 범위</span>
            <span>{{ result.coverageRange || '-' }}</span>
          </div>
          <div class="detail-row">
            <span>자기부담금</span>
            <span>{{ result.deductible?.toLocaleString() || '-' }}원</span>
          </div>
          <div class="detail-row">
            <span>보장 한도</span>
            <span>{{ result.coverageLimit?.toLocaleString() || '-' }}원</span>
          </div>
        </div>
        <!-- TODO: implement detailed plan comparison -->
      </div>

      <button class="btn-reset" @click="handleReset">다시 시뮬레이션</button>
    </section>
  </div>
</template>

<style scoped>
.simulator-page {
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

.page-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-2);
}

.simulator-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: var(--space-5);
}

.form-group > label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
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

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-gray-700);
  cursor: pointer;
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

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.result-card {
  margin-bottom: var(--space-5);
}

.result-card h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-5);
}

.result-summary {
  text-align: center;
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--color-gray-200);
  margin-bottom: var(--space-4);
}

.result-label {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.result-amount {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  margin-top: var(--space-2);
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-md);
}

.detail-row span:first-child {
  color: var(--color-gray-600);
}

.detail-row span:last-child {
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}

.btn-reset {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-gray-600);
  cursor: pointer;
}
</style>
