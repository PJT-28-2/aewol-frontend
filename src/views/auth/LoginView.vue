<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  // TODO: implement login logic with authApi.login()
}

const handleKakaoLogin = () => {
  // TODO: implement Kakao OAuth redirect
}
</script>

<template>
  <div class="login-page">
    <header class="login-header">
      <h1 class="logo">애월</h1>
      <p class="subtitle">반려동물 가계부</p>
    </header>

    <form class="login-form" @submit.prevent="handleLogin">
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

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          required
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '로그인 중...' : '로그인' }}
      </button>
    </form>

    <div class="divider">
      <span>또는</span>
    </div>

    <button class="btn-kakao" @click="handleKakaoLogin">
      <!-- TODO: add Kakao icon -->
      카카오로 시작하기
    </button>

    <nav class="auth-links">
      <router-link to="/signup">회원가입</router-link>
      <router-link to="/password-reset">비밀번호 찾기</router-link>
    </nav>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  background-color: var(--color-bg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.logo {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.subtitle {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-1);
}

.login-form {
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
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 360px;
  margin: var(--space-6) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-gray-300);
}

.divider span {
  padding: 0 var(--space-3);
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.btn-kakao {
  width: 100%;
  max-width: 360px;
  padding: var(--space-3) var(--space-4);
  background-color: #fee500;
  color: #191919;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.auth-links {
  display: flex;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.auth-links a {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  text-decoration: none;
}
</style>
