<script setup>
import { ref } from 'vue'

const step = ref(1) // 1: email, 2: code, 3: new password
const email = ref('')
const code = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleRequestCode = async () => {
  // TODO: implement with authApi.resetPasswordRequest()
}

const handleVerifyCode = async () => {
  // TODO: implement code verification
}

const handleResetPassword = async () => {
  // TODO: implement with authApi.resetPassword()
}
</script>

<template>
  <div class="reset-page">
    <header class="page-header">
      <h1>비밀번호 재설정</h1>
    </header>

    <!-- Step 1: Email Input -->
    <form v-if="step === 1" class="reset-form" @submit.prevent="handleRequestCode">
      <p class="step-description">가입한 이메일 주소를 입력하세요.</p>
      <div class="form-group">
        <label for="email">이메일</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="이메일을 입력하세요"
          required
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '전송 중...' : '인증 코드 발송' }}
      </button>
    </form>

    <!-- Step 2: Code Verification -->
    <form v-else-if="step === 2" class="reset-form" @submit.prevent="handleVerifyCode">
      <p class="step-description">이메일로 전송된 인증 코드를 입력하세요.</p>
      <div class="form-group">
        <label for="code">인증 코드</label>
        <input
          id="code"
          v-model="code"
          type="text"
          placeholder="6자리 코드 입력"
          maxlength="6"
          required
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">확인</button>
    </form>

    <!-- Step 3: New Password -->
    <form v-else class="reset-form" @submit.prevent="handleResetPassword">
      <p class="step-description">새 비밀번호를 설정하세요.</p>
      <div class="form-group">
        <label for="newPassword">새 비밀번호</label>
        <input
          id="newPassword"
          v-model="newPassword"
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          required
        />
      </div>
      <div class="form-group">
        <label for="newPasswordConfirm">새 비밀번호 확인</label>
        <input
          id="newPasswordConfirm"
          v-model="newPasswordConfirm"
          type="password"
          placeholder="새 비밀번호를 다시 입력하세요"
          required
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '변경 중...' : '비밀번호 변경' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <!-- Step indicator -->
    <div class="step-indicator">
      <span :class="{ active: step >= 1 }">1</span>
      <span :class="{ active: step >= 2 }">2</span>
      <span :class="{ active: step >= 3 }">3</span>
    </div>

    <router-link to="/login" class="back-link">로그인으로 돌아가기</router-link>
  </div>
</template>

<style scoped>
.reset-page {
  min-height: 100vh;
  padding: var(--space-6);
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.step-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-bottom: var(--space-5);
  text-align: center;
}

.reset-form {
  width: 100%;
  max-width: 360px;
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
  margin-top: var(--space-3);
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

.step-indicator {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-7);
}

.step-indicator span {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  background-color: var(--color-gray-200);
  color: var(--color-gray-500);
}

.step-indicator span.active {
  background-color: var(--color-navy);
  color: var(--color-white);
}

.back-link {
  margin-top: var(--space-5);
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  text-decoration: none;
}
</style>
