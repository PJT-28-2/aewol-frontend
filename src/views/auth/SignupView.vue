<script setup>
import { ref } from 'vue'

const form = ref({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
})
const isLoading = ref(false)
const errorMessage = ref('')

const handleSignup = async () => {
  // TODO: implement signup logic with authApi.signup()
}
</script>

<template>
  <div class="signup-page">
    <header class="page-header">
      <h1>회원가입</h1>
    </header>

    <form class="signup-form" @submit.prevent="handleSignup">
      <div class="form-group">
        <label for="email">이메일</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="이메일을 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="비밀번호 (8자 이상)"
          required
        />
      </div>

      <div class="form-group">
        <label for="passwordConfirm">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          v-model="form.passwordConfirm"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="name">이름</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="이름을 입력하세요"
          required
        />
      </div>

      <div class="form-group">
        <label for="phone">전화번호</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          placeholder="010-0000-0000"
          required
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? '가입 중...' : '가입하기' }}
      </button>
    </form>

    <p class="login-link">
      이미 계정이 있으신가요?
      <router-link to="/login">로그인</router-link>
    </p>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 100vh;
  padding: var(--space-6);
  background-color: var(--color-bg);
}

.page-header {
  margin-bottom: var(--space-7);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.signup-form {
  max-width: 360px;
  margin: 0 auto;
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
  margin-top: var(--space-4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: var(--space-6);
  font-size: var(--font-sm);
  color: var(--color-gray-600);
}

.login-link a {
  color: var(--color-navy);
  font-weight: var(--font-semibold);
  text-decoration: none;
}
</style>
