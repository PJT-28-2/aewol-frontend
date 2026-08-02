<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { formatCountdown } from '@/utils/date'

const verificationCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const remainingSeconds = ref(180)
let timerInterval = null

const formattedTime = computed(() => formatCountdown(remainingSeconds.value))

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

const handleVerify = async () => {
  // TODO: implement verification with authApi.verifyEmail()
}

const handleResend = async () => {
  // TODO: implement resend verification code
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="verify-page">
    <header class="page-header">
      <h1>이메일 인증</h1>
      <p class="description">
        이메일로 전송된 인증 코드를 입력하세요.
      </p>
    </header>

    <form
      class="verify-form"
      @submit.prevent="handleVerify"
    >
      <div class="form-group">
        <label for="code">인증 코드</label>
        <div class="code-input-wrapper">
          <input
            id="code"
            v-model="verificationCode"
            type="text"
            placeholder="6자리 코드 입력"
            maxlength="6"
            required
          >
          <span
            class="timer"
            :class="{ expired: remainingSeconds <= 0 }"
          >
            {{ formattedTime }}
          </span>
        </div>
      </div>

      <p
        v-if="errorMessage"
        class="error-text"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        type="submit"
        variant="navy"
        size="lg"
        block
        :loading="isLoading"
        :disabled="remainingSeconds <= 0"
      >
        인증 확인
      </AppButton>

      <button
        type="button"
        class="btn-secondary"
        :disabled="remainingSeconds > 0"
        @click="handleResend"
      >
        인증 코드 재발송
      </button>
    </form>
  </div>
</template>

<style scoped>
.verify-page {
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
  margin-bottom: var(--space-7);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-2);
}

.verify-form {
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

.code-input-wrapper {
  position: relative;
}

.code-input-wrapper input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-lg);
  letter-spacing: 4px;
  text-align: center;
  box-sizing: border-box;
}

.timer {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
}

.timer.expired {
  color: var(--color-danger-strong);
}

.error-text {
  color: var(--color-danger-strong);
  font-size: var(--font-sm);
  margin-bottom: var(--space-3);
}

.btn-secondary {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: transparent;
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  cursor: pointer;
  margin-top: var(--space-3);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
