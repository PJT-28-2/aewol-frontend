<script setup>
import { ref } from 'vue'

const form = ref({
  merchantName: '',
  amount: null,
  petId: '',
  category: '',
  memo: '',
})
const isLoading = ref(false)
const errorMessage = ref('')
const autoTagPreview = ref(null)

const pets = ref([]) // TODO: load from pet store
const categoryOptions = [
  { value: 'FOOD', label: '사료/간식' },
  { value: 'MEDICAL', label: '의료' },
  { value: 'GROOMING', label: '미용' },
  { value: 'SUPPLIES', label: '용품' },
  { value: 'INSURANCE', label: '보험' },
  { value: 'ETC', label: '기타' },
]

const handleMerchantInput = () => {
  // TODO: implement auto-tagging preview based on merchant name
}

const handlePayment = async () => {
  // TODO: implement payment submission
}
</script>

<template>
  <div class="payment-page">
    <header class="page-header">
      <h1>결제 등록</h1>
    </header>

    <form class="payment-form" @submit.prevent="handlePayment">
      <div class="form-group">
        <label for="merchantName">가맹점명</label>
        <input
          id="merchantName"
          v-model="form.merchantName"
          type="text"
          placeholder="예: 바른동물병원"
          required
          @input="handleMerchantInput"
        />
      </div>

      <!-- Auto-tagging Preview -->
      <div v-if="autoTagPreview" class="auto-tag-preview card">
        <p class="preview-label">자동 분류</p>
        <span class="tag">{{ autoTagPreview.category }}</span>
        <span v-if="autoTagPreview.petName" class="tag pet-tag">{{ autoTagPreview.petName }}</span>
      </div>

      <div class="form-group">
        <label for="amount">금액</label>
        <input
          id="amount"
          v-model.number="form.amount"
          type="number"
          placeholder="결제 금액"
          required
        />
      </div>

      <div class="form-group">
        <label for="petId">반려동물 선택</label>
        <select id="petId" v-model="form.petId">
          <option value="">선택 안 함</option>
          <option v-for="pet in pets" :key="pet.id" :value="pet.id">
            {{ pet.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="category">카테고리</label>
        <select id="category" v-model="form.category" required>
          <option value="" disabled>카테고리 선택</option>
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="memo">메모 (선택)</label>
        <input
          id="memo"
          v-model="form.memo"
          type="text"
          placeholder="메모를 입력하세요"
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '등록 중...' : '결제 등록' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.payment-page {
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

.payment-form {
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

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.auto-tag-preview {
  margin-bottom: var(--space-4);
  background-color: var(--color-gray-100);
  border: 1px solid var(--color-gold-light);
}

.preview-label {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
}

.tag {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  background-color: var(--color-navy);
  color: var(--color-white);
  margin-right: var(--space-2);
}

.pet-tag {
  background-color: var(--color-gold);
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
