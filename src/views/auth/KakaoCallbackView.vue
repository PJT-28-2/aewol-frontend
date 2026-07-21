<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const errorMessage = ref('')

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    errorMessage.value = '인증 코드가 없습니다.'
    return
  }

  // TODO: implement with authApi.kakaoLogin(code)
  // On success: store tokens, redirect to home
  // On failure: show error, redirect to login
})
</script>

<template>
  <div class="callback-page">
    <div v-if="!errorMessage" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">카카오 로그인 처리 중...</p>
    </div>

    <div v-else class="error-container">
      <p class="error-text">{{ errorMessage }}</p>
      <router-link to="/login" class="btn-link">로그인으로 돌아가기</router-link>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
}

.loading-container {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-navy);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-5);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: var(--font-base);
  color: var(--color-gray-600);
}

.error-container {
  text-align: center;
}

.error-text {
  font-size: var(--font-base);
  color: var(--color-danger);
  margin-bottom: var(--space-5);
}

.btn-link {
  font-size: var(--font-md);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-semibold);
}
</style>
