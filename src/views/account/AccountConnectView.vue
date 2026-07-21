<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const step = ref(1) // 1: bank selection, 2: account form
const selectedBank = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const banks = [
  { code: 'KB', name: 'KB국민은행' },
  { code: 'SHINHAN', name: '신한은행' },
  { code: 'WOORI', name: '우리은행' },
  { code: 'HANA', name: '하나은행' },
  { code: 'NH', name: 'NH농협은행' },
  { code: 'IBK', name: 'IBK기업은행' },
  { code: 'KAKAO', name: '카카오뱅크' },
  { code: 'TOSS', name: '토스뱅크' },
]

const accountForm = ref({
  accountNumber: '',
  accountPassword: '',
})

const selectBank = (bankCode) => {
  selectedBank.value = bankCode
  step.value = 2
}

const handleConnect = async () => {
  // TODO: implement account connection via CODEF API
}
</script>

<template>
  <div class="account-connect-page">
    <header class="page-header">
      <router-link to="/accounts" class="back-btn">&lsaquo; 목록</router-link>
      <h1>계좌 연결</h1>
    </header>

    <!-- Step 1: Bank Selection -->
    <section v-if="step === 1" class="bank-selection">
      <p class="step-description">연결할 은행을 선택하세요.</p>
      <div class="bank-grid">
        <button
          v-for="bank in banks"
          :key="bank.code"
          class="bank-item card"
          @click="selectBank(bank.code)"
        >
          <div class="bank-logo">
            <!-- TODO: implement bank logo -->
          </div>
          <span class="bank-name">{{ bank.name }}</span>
        </button>
      </div>
    </section>

    <!-- Step 2: Account Form -->
    <section v-else class="account-form-section">
      <button class="back-step" @click="step = 1">&lsaquo; 은행 다시 선택</button>
      <p class="step-description">
        {{ banks.find(b => b.code === selectedBank)?.name }} 계좌 정보를 입력하세요.
      </p>

      <form class="connect-form" @submit.prevent="handleConnect">
        <div class="form-group">
          <label for="accountNumber">계좌번호</label>
          <input
            id="accountNumber"
            v-model="accountForm.accountNumber"
            type="text"
            placeholder="계좌번호 입력 (- 제외)"
            required
          />
        </div>

        <div class="form-group">
          <label for="accountPassword">계좌 비밀번호</label>
          <input
            id="accountPassword"
            v-model="accountForm.accountPassword"
            type="password"
            placeholder="계좌 비밀번호"
            required
          />
        </div>

        <!-- TODO: implement additional CODEF authentication fields -->

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <div class="security-notice">
          <p>계좌 정보는 CODEF를 통해 안전하게 연결됩니다.</p>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? '연결 중...' : '계좌 연결하기' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.account-connect-page {
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

.step-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-bottom: var(--space-5);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.bank-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.bank-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  border: none;
  cursor: pointer;
  padding: var(--space-5) var(--space-4);
}

.bank-logo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-gray-200);
}

.bank-name {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
}

.back-step {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: var(--space-4);
  padding: 0;
}

.connect-form {
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

.form-group input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-sm);
  margin-bottom: var(--space-3);
}

.security-notice {
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
}

.security-notice p {
  font-size: var(--font-xs);
  color: var(--color-gray-600);
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
</style>
