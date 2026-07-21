<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const confirmText = ref('')
const isProcessing = ref(false)
const errorMessage = ref('')

const isConfirmed = () => confirmText.value === '탈퇴합니다'

const handleWithdraw = async () => {
  if (!isConfirmed()) return
  // TODO: implement account withdrawal with authApi.withdraw()
}
</script>

<template>
  <div class="withdraw-page">
    <header class="page-header">
      <router-link to="/settings" class="back-btn">&lsaquo; 설정</router-link>
      <h1>회원 탈퇴</h1>
    </header>

    <section class="warning-section card">
      <h2>정말 탈퇴하시겠습니까?</h2>
      <ul class="warning-list">
        <li>모든 반려동물 정보가 삭제됩니다.</li>
        <li>지갑 잔액 및 거래 내역이 삭제됩니다.</li>
        <li>보험 청구 내역이 삭제됩니다.</li>
        <li>삭제된 데이터는 복구할 수 없습니다.</li>
      </ul>
    </section>

    <section class="confirm-section card">
      <p class="confirm-instruction">
        탈퇴를 확인하려면 아래에 <strong>"탈퇴합니다"</strong>를 입력하세요.
      </p>
      <div class="form-group">
        <input
          v-model="confirmText"
          type="text"
          placeholder="탈퇴합니다"
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <button
        class="btn-danger"
        :disabled="!isConfirmed() || isProcessing"
        @click="handleWithdraw"
      >
        {{ isProcessing ? '처리 중...' : '회원 탈퇴' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.withdraw-page {
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
  color: var(--color-danger);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.warning-section {
  margin-bottom: var(--space-5);
  border: 1px solid var(--color-danger);
}

.warning-section h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}

.warning-list {
  padding-left: var(--space-5);
  margin: 0;
}

.warning-list li {
  font-size: var(--font-md);
  color: var(--color-gray-700);
  padding: var(--space-2) 0;
  line-height: 1.5;
}

.confirm-section {
  margin-bottom: var(--space-5);
}

.confirm-instruction {
  font-size: var(--font-md);
  color: var(--color-gray-700);
  margin-bottom: var(--space-4);
  line-height: 1.5;
}

.confirm-instruction strong {
  color: var(--color-danger);
}

.form-group {
  margin-bottom: var(--space-4);
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

.btn-danger {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-danger);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
