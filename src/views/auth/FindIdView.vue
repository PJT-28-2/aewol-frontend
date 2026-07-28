<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'

const router = useRouter()

const name = ref('')
const phone = ref('')
const verificationCode = ref('')
const isCodeSent = ref(false)
const isVerified = ref(false)
const isResultVisible = ref(false)
const foundEmail = ref('')
const remainingSeconds = ref(0)
const toast = ref({ visible: false, type: 'success', message: '' })
// API 연결 전 화면 검수를 위한 개발 전용 인증 우회 플래그다.
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
 * 입력 검증 및 인증 결과를 일정 시간 동안 안내한다.
 * 메시지가 연속 발생하면 이전 종료 타이머를 교체해 최신 안내 시간을 보장한다.
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
  }, 3000)
}

/**
 * 인증번호의 3분 유효 시간을 시작한다.
 * 재전송 시 타이머가 중첩되지 않도록 기존 작업을 먼저 해제한다.
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
 * 이름과 전화번호를 검증하고 본인 확인용 인증번호 발송을 시작한다.
 * 현재 운영 API 명세가 없어 개발 모드에서만 발송 상태를 모의 처리한다.
 *
 * @returns {void}
 */
const handleRequestCode = () => {
  // =========================
  // 입력값 검증
  // =========================
  if (!name.value.trim()) {
    showToast('이름을 입력해주세요')
    return
  }

  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value)) {
    showToast('올바른 전화번호 형식이 아닙니다')
    return
  }

  // 운영 API 경로를 임의로 생성하면 계약 불일치 위험이 있어 명세 확정 전 호출을 차단한다.
  if (!isDevelopmentPreview) {
    showToast('아이디 찾기 인증 API 연결이 필요합니다')
    return
  }

  // =========================
  // 개발용 화면 상태 업데이트
  // =========================
  // 재전송 시 이전 인증 결과를 폐기하여 실제 인증 흐름과 같은 상태로 되돌린다.
  isCodeSent.value = true
  isVerified.value = false
  verificationCode.value = ''
  startTimer()
  showToast('개발용 인증번호는 123456입니다', 'success')
}

/**
 * 입력한 인증번호를 확인하고 아이디 찾기 실행 권한을 활성화한다.
 * 개발 환경에서는 Figma 후속 화면 검수를 위해 고정 번호만 허용한다.
 *
 * @returns {void}
 */
const handleVerifyCode = () => {
  // =========================
  // 인증번호 형식 및 상태 검증
  // =========================
  if (!/^\d{6}$/.test(verificationCode.value)) {
    showToast('인증번호가 일치하지 않습니다')
    return
  }

  if (isDevelopmentPreview && verificationCode.value === '123456') {
    // 운영 빌드에 우회가 포함되지 않도록 DEV 플래그와 고정 번호를 함께 검사한다.
    isVerified.value = true
    window.clearInterval(timerId)
    showToast('인증되었습니다', 'success')
    return
  }

  // 운영 환경에서는 발송하지 않은 번호를 검증하지 않도록 선제적으로 차단한다.
  if (!isDevelopmentPreview && !isCodeSent.value) {
    showToast('인증번호를 먼저 받아주세요')
    return
  }

  showToast('인증번호가 일치하지 않습니다')
}

/**
 * 인증된 사용자의 가입 이메일을 결과 화면에 표시한다.
 * API 명세 확정 전에는 개발용 응답으로 마스킹 UI만 검수한다.
 *
 * @returns {void}
 */
const handleFindId = () => {
  // 상태가 임의로 변경되더라도 인증 전 결과 화면으로 넘어가지 않도록 다시 확인한다.
  if (!isVerified.value) {
    showToast('본인 인증을 완료해주세요')
    return
  }

  // TODO: 아이디 찾기 API 명세 확정 후 서버가 반환한 이메일로 교체한다.
  // 현재 값은 결과 화면과 마스킹 동작을 검수하기 위한 개발용 응답이다.
  foundEmail.value = 'honggildong@aewol.com'

  // 결과 화면 자체가 성공을 설명하므로 기존 성공 토스트는 숨겨 중복 안내를 피한다.
  toast.value.visible = false
  isResultVisible.value = true
}

/**
 * 가입 이메일의 도메인은 유지하고 로컬파트 일부를 숨긴다.
 * 한 글자 계정이 그대로 노출되는 것을 막기 위해 길이에 따라 공개 범위를 제한한다.
 *
 * @returns {string} 마스킹된 이메일
 */
const maskedEmail = computed(() => {
  const [localPart, domain] = foundEmail.value.split('@')
  if (!localPart || !domain) return ''

  const visibleLength =
    localPart.length <= 1
      ? 0
      : Math.min(2, localPart.length - 1)

  return `${localPart.slice(0, visibleLength)}****@${domain}`
})

/**
 * 화면 종료 후 인증 및 토스트 타이머를 정리한다.
 * 언마운트된 화면에서 상태가 변경되는 문제와 불필요한 메모리 점유를 방지한다.
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
  <main class="find-id-page">
    <section v-if="isResultVisible" class="find-id-result" aria-labelledby="find-id-result-title">
      <div class="find-id-result__icon" aria-hidden="true">
        <IconCheck :size="32" />
      </div>
      <h1 id="find-id-result-title">본인 확인이 완료됐어요</h1>
      <p>{{ name || '홍길동' }}님의 가입 이메일이에요</p>
      <div class="find-id-result__email">{{ maskedEmail }}</div>
      <router-link class="find-id-result__login" to="/login">로그인하러 가기</router-link>
      <router-link class="find-id-result__password" to="/password/reset">
        비밀번호를 잊으셨나요? 비밀번호 찾기
      </router-link>
    </section>

    <template v-else>
      <button class="find-id-back" type="button" aria-label="이전 화면으로 돌아가기" @click="router.back()">
        <IconArrowLeft :size="26" />
      </button>

      <header class="find-id-header">
        <h1>아이디 찾기</h1>
        <p>이름과 전화번호로 본인 확인 후<br />가입하신 이메일을 알려드려요</p>
      </header>

      <form class="find-id-form" @submit.prevent="handleFindId">
        <label for="find-id-name">이름</label>
        <input
          id="find-id-name"
          v-model.trim="name"
          type="text"
          autocomplete="name"
          placeholder="홍길동"
        />

        <label for="find-id-phone">전화번호</label>
        <div class="field-row field-row--phone">
          <input
            id="find-id-phone"
            v-model.trim="phone"
            type="tel"
            autocomplete="tel"
            placeholder="010-1234-5678"
          />
          <button type="button" @click="handleRequestCode">
            {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>

        <div class="verification-label">
          <label for="find-id-code">인증번호</label>
          <span v-if="isCodeSent && !isVerified">{{ formattedTime }}</span>
        </div>
        <div class="field-row field-row--code">
          <input
            id="find-id-code"
            v-model="verificationCode"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="6자리 숫자 입력"
            :disabled="isVerified"
          />
          <button type="button" :disabled="isVerified" @click="handleVerifyCode">확인</button>
        </div>

        <button class="find-id-submit" type="submit">아이디 찾기</button>
      </form>

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
.find-id-page {
  position: relative;
  width: min(100%, 390px);
  min-height: 100svh;
  margin: 0 auto;
  padding: 108px 22px 48px;
  overflow: hidden;
  background: var(--color-white);
  border-radius: 40px;
}

.find-id-result {
  text-align: center;
}

.find-id-result__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin: 92px auto 0;
  color: var(--color-olive);
  background: var(--color-pastel-green);
  border-radius: 44px;
  font-size: 32px;
  font-weight: var(--font-bold);
  line-height: 1;
}

.find-id-result h1 {
  margin-top: 28px;
  color: var(--color-navy);
  font-size: 18px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.find-id-result p {
  margin-top: 8px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
  line-height: 1.3;
}

.find-id-result__email {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 66px;
  margin-top: 27px;
  color: var(--color-navy);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  font-size: 16px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.find-id-result__login {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  margin-top: 24px;
  color: var(--color-navy);
  background: var(--color-gold);
  border-radius: var(--radius-xl);
  font-size: 14.5px;
  font-weight: var(--font-bold);
}

.find-id-result__password {
  display: block;
  margin-top: 11px;
  color: var(--color-slate-dark);
  font-size: 11.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.find-id-back {
  position: absolute;
  top: 60px;
  left: 22px;
  width: 26px;
  height: 26px;
  color: var(--color-navy);
}

.find-id-header h1 {
  color: var(--color-navy);
  font-size: 22px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.find-id-header p {
  margin-top: 2px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.find-id-form {
  display: flex;
  flex-direction: column;
  margin-top: 22px;
}

.find-id-form label {
  margin-bottom: 4px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.find-id-form > input {
  margin-bottom: 11px;
}

.find-id-form input {
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

.find-id-form input::placeholder {
  color: var(--color-slate-muted);
  opacity: 1;
}

.find-id-form input:focus {
  border-color: var(--color-navy);
}

.field-row {
  display: grid;
  gap: 16px;
}

.field-row--phone {
  grid-template-columns: minmax(0, 240px) 90px;
  margin-bottom: 31px;
}

.field-row--code {
  grid-template-columns: minmax(0, 270px) 60px;
}

.field-row button {
  height: 46px;
  color: var(--color-white);
  background: var(--color-navy);
  border-radius: var(--radius-lg);
  font-size: 11.5px;
  font-weight: var(--font-bold);
}

.field-row--code button {
  font-size: 12.5px;
}

.field-row button:disabled {
  opacity: 0.55;
}

.verification-label {
  display: flex;
  justify-content: space-between;
}

.verification-label span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: var(--font-bold);
}

.find-id-submit {
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
  .find-id-page {
    min-height: 844px;
    margin-block: max(0px, calc((100svh - 844px) / 2));
    box-shadow: var(--shadow-lg);
  }
}
</style>
