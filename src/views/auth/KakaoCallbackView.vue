<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref('')

onMounted(async () => {
  const returnedState =
    typeof route.query.state === 'string' ? route.query.state : ''
  const expectedState = window.sessionStorage.getItem(
    KAKAO_OAUTH_STATE_KEY,
  )

  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY)

  if (
    !expectedState ||
    !returnedState ||
    returnedState !== expectedState
  ) {
    errorMessage.value = '유효하지 않은 로그인 요청입니다. 다시 시도해주세요.'
    return
  }

  if (route.query.error) {
    errorMessage.value = '카카오 로그인이 취소되었거나 실패했습니다.'
    return
  }

  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code) {
    errorMessage.value = '인증 코드가 없습니다.'
    return
  }

  try {
    await authStore.kakaoLogin(code)
    await router.replace('/home')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '카카오 로그인 처리에 실패했습니다.'
  }
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
