<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'

const router = useRouter()

const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const isCodeSent = ref(false)
const isVerified = ref(false)
const isComplete = ref(false)
const isLoading = ref(false)
const remainingSeconds = ref(0)
const toast = ref({ visible: false, type: 'success', message: '' })
// 화면 검수용 우회는 Vite 개발 서버에서만 활성화된다.
const isDevelopmentPreview = import.meta.env.DEV

let timerId
let toastTimerId

/**
 * 남은 인증 유효 시간을 사용자가 읽기 쉬운 분·초 형식으로 제공한다.
 *
 * @returns {string} `mm:ss` 형식의 남은 시간
 */
const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

/**
 * 유효성 검사 결과를 일정 시간 동안 토스트로 안내한다.
 * 연속 메시지가 겹치지 않도록 기존 종료 타이머를 취소하고 다시 시작한다.
 *
 * @param {string} message 사용자에게 표시할 안내 문구
 * @param {'success'|'error'} [type='error'] 메시지 상태
 * @returns {void}
 */
const showToast = (message, type = 'error') => {
  toast.value = { visible: true, type, message }
  window.clearTimeout(toastTimerId)
  toastTimerId = window.setTimeout(() => {
    toast.value.visible = false
  }, 2600)
}

/**
 * 인증번호의 3분 유효 시간을 시작한다.
 * 재전송 시 기존 타이머가 중복 실행되지 않도록 먼저 정리한다.
 *
 * @returns {void}
 */
const startTimer = () => {
  window.clearInterval(timerId)
  remainingSeconds.value = 180
  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      window.clearInterval(timerId)
      remainingSeconds.value = 0
      return
    }

    remainingSeconds.value -= 1
  }, 1000)
}

/**
 * 인증번호를 발송하기 전에 이메일의 기본 형식을 확인한다.
 *
 * @param {string} value 검사할 이메일
 * @returns {boolean} 이메일 기본 형식 충족 여부
 */
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/**
 * 새 비밀번호가 최소 길이와 문자 조합 규칙을 충족하는지 확인한다.
 *
 * @param {string} value 검사할 비밀번호
 * @returns {boolean} 8자 이상이며 문자 종류를 2개 이상 조합했는지 여부
 */
const isValidPassword = (value) => {
  const categoryCount = [
    /[A-Za-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length

  return value.length >= 8 && categoryCount >= 2
}

/**
 * 입력한 이메일로 비밀번호 재설정 인증번호를 요청한다.
 * 개발 모드에서는 백엔드 없이 후속 화면을 검수할 수 있도록 발송을 모의 처리한다.
 *
 * @returns {Promise<void>}
 */
const handleRequestCode = async () => {
  // =========================
  // 입력값 검증
  // =========================
  if (!isValidEmail(email.value)) {
    showToast('올바른 이메일 형식이 아닙니다')
    return
  }

  isLoading.value = true

  try {
    // =========================
    // 인증번호 발송 API 요청
    // =========================
    // 개발 모드에서는 백엔드 없이 전체 화면 흐름을 확인한다.
    if (!isDevelopmentPreview) {
      // 가입 이메일의 본인 확인을 시작하기 위해 인증번호 발송을 요청한다.
      await authApi.resetPasswordRequest(email.value)
    }

    // =========================
    // 화면 상태 업데이트
    // =========================
    // 재전송 시 이전 인증 결과를 폐기하여 과거 인증번호의 재사용을 막는다.
    isCodeSent.value = true
    isVerified.value = false
    verificationCode.value = ''
    startTimer()
    showToast(
      isDevelopmentPreview
        ? '개발용 인증번호는 123456입니다'
        : '인증번호를 전송했습니다',
      'success',
    )
  } catch (error) {
    showToast(error.response?.data?.message ?? '인증번호 전송에 실패했습니다')
  } finally {
    isLoading.value = false
  }
}

/**
 * 입력한 인증번호를 검증하고 새 비밀번호 설정 단계를 활성화한다.
 * 운영 환경에서는 발송 여부와 만료 시간을 선검증해 불필요한 API 호출을 줄인다.
 *
 * @returns {Promise<void>}
 */
const handleVerifyCode = async () => {
  // =========================
  // 인증 상태 및 입력값 검증
  // =========================
  // 운영 환경에서는 실제 발송한 인증번호만 검증할 수 있어 발송 상태가 필수다.
  if (!isDevelopmentPreview && !isCodeSent.value) {
    showToast('인증번호를 먼저 받아주세요')
    return
  }

  if (!/^\d{6}$/.test(verificationCode.value)) {
    showToast('인증번호가 일치하지 않습니다')
    return
  }

  // 운영 환경의 만료된 인증번호는 서버 요청 전에 차단해 사용자에게 즉시 안내한다.
  if (!isDevelopmentPreview && remainingSeconds.value === 0) {
    showToast('인증번호가 만료되었습니다')
    return
  }

  isLoading.value = true

  try {
    // =========================
    // 인증번호 검증 API 요청
    // =========================
    if (isDevelopmentPreview) {
      // 개발용 고정 인증번호이며 프로덕션 빌드에서는 실행되지 않는다.
      if (verificationCode.value !== '123456') {
        showToast('인증번호가 일치하지 않습니다')
        return
      }
    } else {
      // 서버가 이메일과 인증번호의 실제 일치 여부를 검증하도록 요청한다.
      await authApi.verifyEmail(email.value, verificationCode.value)
    }

    // =========================
    // 화면 상태 업데이트
    // =========================
    // 이 값이 true가 된 뒤에만 새 비밀번호 입력 영역을 렌더링한다.
    isVerified.value = true
    window.clearInterval(timerId)
    showToast('인증되었습니다', 'success')
  } catch (error) {
    showToast(error.response?.data?.message ?? '인증번호가 일치하지 않습니다')
  } finally {
    isLoading.value = false
  }
}

/**
 * 인증이 완료된 계정의 비밀번호를 새 값으로 변경한다.
 * 프론트 검증은 빠른 UX를 위한 것이며 운영 환경의 최종 검증은 서버가 담당한다.
 *
 * @returns {Promise<void>}
 */
const handleResetPassword = async () => {
  // =========================
  // 인증 상태 및 입력값 검증
  // =========================
  // 화면 상태가 변조되더라도 인증 전 변경 요청을 만들지 않도록 다시 확인한다.
  if (!isVerified.value) {
    showToast('이메일 인증을 완료해주세요')
    return
  }

  if (!isValidPassword(newPassword.value)) {
    showToast('영문·숫자·특수문자 중 2가지 이상을 조합해 8자리 이상 입력해주세요')
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    showToast('비밀번호가 일치하지 않습니다')
    return
  }

  isLoading.value = true

  try {
    // =========================
    // 비밀번호 변경 API 요청
    // =========================
    // 운영 환경에서는 서버가 인증 완료 여부와 비밀번호 규칙을 다시 검증해야 한다.
    if (!isDevelopmentPreview) {
      await authApi.resetPassword({
        email: email.value,
        code: verificationCode.value,
        newPassword: newPassword.value,
      })
    }

    // =========================
    // 완료 화면 상태 업데이트
    // =========================
    // 성공 안내를 토스트와 중복 표시하지 않고 Figma 완료 화면으로 전환한다.
    toast.value.visible = false
    isComplete.value = true
  } catch (error) {
    showToast(error.response?.data?.message ?? '비밀번호 변경에 실패했습니다')
  } finally {
    isLoading.value = false
  }
}

/**
 * 화면 종료 후 남은 타이머를 정리한다.
 * 언마운트된 화면의 상태 변경과 불필요한 메모리 점유를 방지한다.
 *
 * @returns {void}
 */
const clearTimers = () => {
  window.clearInterval(timerId)
  window.clearTimeout(toastTimerId)
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <main class="reset-page">
    <section v-if="isComplete" class="reset-complete" aria-labelledby="reset-complete-title">
      <div class="reset-complete__icon" aria-hidden="true">
        <IconCheck :size="32" />
      </div>
      <h1 id="reset-complete-title">비밀번호가 변경됐어요</h1>
      <p>새 비밀번호로 다시 로그인해주세요</p>
      <router-link class="reset-complete__button" to="/login">로그인하러 가기</router-link>
    </section>

    <template v-else>
      <button class="reset-back" type="button" aria-label="이전 화면으로 돌아가기" @click="router.back()">
        <IconArrowLeft :size="26" />
      </button>

      <header class="reset-header">
        <h1>비밀번호 찾기</h1>
        <p>가입하신 이메일로 본인 확인 후<br />바로 새 비밀번호를 설정해요</p>
      </header>

      <section class="reset-verification" aria-label="이메일 인증">
        <label for="reset-email">이메일</label>
        <div class="field-row field-row--email">
          <input
            id="reset-email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="example@aewol.com"
            :disabled="isVerified"
          />
          <button type="button" :disabled="isLoading || isVerified" @click="handleRequestCode">
            {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>

        <label for="verification-code">인증번호</label>
        <div class="field-row field-row--code">
          <div class="code-input">
            <input
              id="verification-code"
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="6자리 숫자 입력"
              :disabled="isVerified"
            />
            <span v-if="isCodeSent && !isVerified" class="timer">{{ formattedTime }}</span>
          </div>
          <button type="button" :disabled="isLoading || isVerified" @click="handleVerifyCode">
            확인
          </button>
        </div>
      </section>

      <section v-if="isVerified" class="new-password" aria-label="새 비밀번호 설정">
        <div class="section-divider">
          <span>인증 완료 후 새 비밀번호 설정</span>
        </div>

        <form @submit.prevent="handleResetPassword">
          <label for="new-password">새 비밀번호</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="8자 이상 입력해주세요"
            required
          />

          <label for="new-password-confirm">새 비밀번호 확인</label>
          <input
            id="new-password-confirm"
            v-model="newPasswordConfirm"
            type="password"
            autocomplete="new-password"
            placeholder="비밀번호를 한번 더 입력해주세요"
            required
          />

          <button class="reset-submit" type="submit" :disabled="isLoading">
            {{ isLoading ? '변경 중...' : '비밀번호 변경하기' }}
          </button>
        </form>
      </section>

      <router-link class="login-link" to="/login">로그인으로 돌아가기</router-link>

      <Teleport to="body">
        <Transition name="toast">
          <div
            v-if="toast.visible"
            class="validation-toast"
            :class="`validation-toast--${toast.type}`"
            role="alert"
            aria-live="assertive"
          >
            <span class="validation-toast__icon" aria-hidden="true">
              {{ toast.type === 'success' ? '✓' : '!' }}
            </span>
            <span>{{ toast.message }}</span>
          </div>
        </Transition>
      </Teleport>
    </template>
  </main>
</template>

<style scoped>
.reset-page {
  position: relative;
  width: min(100%, 390px);
  min-height: 100svh;
  margin: 0 auto;
  padding: 108px 22px 48px;
  overflow: hidden;
  background: var(--color-white);
  border-radius: 40px;
}

.reset-complete {
  text-align: center;
}

.reset-complete__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin: 112px auto 0;
  color: var(--color-olive);
  background: var(--color-pastel-green);
  border-radius: 44px;
  font-size: 32px;
  font-weight: var(--font-bold);
  line-height: 1;
}

.reset-complete h1 {
  margin-top: 28px;
  color: var(--color-navy);
  font-size: 18px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.reset-complete p {
  margin-top: 8px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
  line-height: 1.3;
}

.reset-complete__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  margin-top: 44px;
  color: var(--color-navy);
  background: var(--color-gold);
  border-radius: var(--radius-xl);
  font-size: 14.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.reset-back {
  position: absolute;
  top: 60px;
  left: 22px;
  width: 26px;
  height: 26px;
  color: var(--color-navy);
}

.reset-header h1 {
  color: var(--color-navy);
  font-size: 22px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.reset-header p {
  margin-top: 2px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.reset-verification {
  margin-top: 22px;
}

.reset-page label {
  display: block;
  margin-bottom: 4px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.field-row {
  display: grid;
  gap: 16px;
}

.field-row--email {
  grid-template-columns: minmax(0, 240px) 90px;
  margin-bottom: 31px;
}

.field-row--code {
  grid-template-columns: minmax(0, 270px) 60px;
}

.reset-page input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  color: var(--color-navy);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  outline: none;
}

.reset-page input::placeholder {
  color: var(--color-slate-muted);
  opacity: 1;
}

.reset-page input:focus {
  border-color: var(--color-navy);
}

.reset-page input:disabled {
  opacity: 0.65;
}

.field-row > button {
  height: 46px;
  color: var(--color-white);
  background: var(--color-navy);
  border-radius: var(--radius-lg);
  font-size: 11.5px;
  font-weight: var(--font-bold);
}

.field-row--code > button {
  font-size: 12.5px;
}

.field-row > button:disabled,
.reset-submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.code-input {
  position: relative;
}

.code-input input {
  padding-right: 70px;
}

.timer {
  position: absolute;
  top: 50%;
  right: 14px;
  color: var(--color-gold);
  font-size: 11.5px;
  font-weight: var(--font-bold);
  transform: translateY(-50%);
}

.section-divider {
  position: relative;
  height: 28px;
  margin-top: 14px;
}

.section-divider::before {
  position: absolute;
  top: 13px;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--color-border);
  content: '';
}

.section-divider span {
  position: absolute;
  top: 5px;
  left: 50%;
  padding: 0 8px;
  color: var(--color-slate-muted);
  background: var(--color-white);
  font-size: 11.5px;
  font-weight: var(--font-bold);
  white-space: nowrap;
  transform: translateX(-50%);
}

.new-password form {
  display: flex;
  flex-direction: column;
}

.new-password input + label {
  margin-top: 11px;
}

.reset-submit {
  height: 52px;
  margin-top: 24px;
  color: var(--color-navy);
  background: var(--color-gold);
  border-radius: var(--radius-xl);
  font-size: 14.5px;
  font-weight: var(--font-bold);
}

.login-link {
  display: block;
  margin-top: 15px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  text-align: center;
}

.validation-toast {
  position: fixed;
  z-index: 1100;
  top: 28px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(calc(100% - 44px), 346px);
  min-height: 56px;
  padding: 12px 16px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  transform: translateX(-50%);
}

.validation-toast__icon {
  display: inline-flex;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 11px;
}

.validation-toast--success {
  color: #3f5a08;
}

.validation-toast--success .validation-toast__icon {
  background: #eff5df;
}

.validation-toast--error {
  color: #c24d4d;
}

.validation-toast--error .validation-toast__icon {
  background: #fde8e8;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}

@media (min-width: 391px) {
  .reset-page {
    min-height: 844px;
    margin-block: max(0px, calc((100svh - 844px) / 2));
    box-shadow: var(--shadow-lg);
  }
}
</style>
