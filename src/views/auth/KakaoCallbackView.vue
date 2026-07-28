<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref('')

/**
 * 카카오 OAuth 콜백을 검증하고 애월 로그인을 완료한다.
 * 로그인 화면에서 생성한 state가 일치할 때만 인증 코드를 서버에 전달한다.
 *
 * @returns {Promise<void>}
 */
const handleKakaoCallback = async () => {
  // =========================
  // OAuth state 검증
  // =========================
  const returnedState =
    typeof route.query.state === 'string' ? route.query.state : ''
  const expectedState = window.sessionStorage.getItem(
    KAKAO_OAUTH_STATE_KEY,
  )

  // 로그인 화면에서 시작하지 않은 콜백은 CSRF 요청일 수 있어 API 호출 전에 차단한다.
  // 검증 전에 저장값을 삭제하면 잘못된 콜백 하나로 정상 로그인 시도가 무효화될 수 있다.
  if (
    !expectedState ||
    !returnedState ||
    returnedState !== expectedState
  ) {
    errorMessage.value = '유효하지 않은 로그인 요청입니다. 다시 시도해주세요.'
    return
  }

  // 일치가 확인된 state는 재사용 공격을 막기 위해 즉시 제거한다.
  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY)

  // 사용자가 카카오 동의를 취소한 경우 불필요한 인증 코드 처리를 진행하지 않는다.
  if (route.query.error) {
    errorMessage.value = '카카오 로그인이 취소되었거나 실패했습니다.'
    return
  }

  // =========================
  // 카카오 로그인 API 요청
  // =========================
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code) {
    errorMessage.value = '인증 코드가 없습니다.'
    return
  }

  try {
    // 백엔드가 카카오 인증 코드를 교환하고 애월 토큰을 발급하도록 요청한다.
    await authStore.kakaoLogin(code)
    await router.replace('/home')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '카카오 로그인 처리에 실패했습니다.'
  }
}

onMounted(handleKakaoCallback)
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
