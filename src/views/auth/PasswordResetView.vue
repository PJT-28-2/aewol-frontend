<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { formatCountdown } from '@/utils/date'
import PasswordInput from '@/components/common/PasswordInput.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import StatusVisual from '@/components/common/StatusVisual.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'

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
const emailMessage = ref({ type: 'error', text: '' })
const codeMessage = ref({ type: 'error', text: '' })
const submitError = ref('')
// 화면 검수용 우회는 Vite 개발 서버에서만 활성화된다.
const isDevelopmentPreview = import.meta.env.DEV

let timerId

/**
 * 남은 인증 유효 시간을 사용자가 읽기 쉬운 분·초 형식으로 제공한다.
 *
 * @returns {string} `mm:ss` 형식의 남은 시간
 */
const formattedTime = computed(() => formatCountdown(remainingSeconds.value))

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
 * 문자 종류가 많을수록 요구 길이를 줄여 보안성과 입력 편의의 균형을 맞춘다.
 *
 * @param {string} value 검사할 비밀번호
 * @returns {boolean} 2종류 조합 10자 이상 또는 3종류 조합 8자 이상 충족 여부
 */
const isValidPassword = (value) => {
  const categoryCount = [
    /[A-Za-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length

  return (
    (categoryCount >= 3 && value.length >= 8) ||
    (categoryCount >= 2 && value.length >= 10)
  )
}

const isNewPasswordValid = computed(() =>
  isValidPassword(newPassword.value),
)

const isNewPasswordConfirmed = computed(
  () => newPasswordConfirm.value === newPassword.value,
)

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
    emailMessage.value = { type: 'error', text: '올바른 이메일 형식이 아닙니다' }
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
    codeMessage.value = { type: 'error', text: '' }
    startTimer()
    emailMessage.value = {
      type: 'success',
      text: isDevelopmentPreview
        ? '개발용 인증번호는 123456입니다'
        : '인증번호를 전송했습니다',
    }
  } catch (error) {
    emailMessage.value = {
      type: 'error',
      text: error.response?.data?.message ?? '인증번호 전송에 실패했습니다',
    }
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
    codeMessage.value = { type: 'error', text: '인증번호를 먼저 받아주세요' }
    return
  }

  if (!/^\d{6}$/.test(verificationCode.value)) {
    codeMessage.value = { type: 'error', text: '인증번호가 일치하지 않습니다' }
    return
  }

  // 운영 환경의 만료된 인증번호는 서버 요청 전에 차단해 사용자에게 즉시 안내한다.
  if (!isDevelopmentPreview && remainingSeconds.value === 0) {
    codeMessage.value = { type: 'error', text: '인증번호가 만료되었습니다' }
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
        codeMessage.value = { type: 'error', text: '인증번호가 일치하지 않습니다' }
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
    codeMessage.value = { type: 'success', text: '인증되었습니다' }
  } catch (error) {
    codeMessage.value = {
      type: 'error',
      text: error.response?.data?.message ?? '인증번호가 일치하지 않습니다',
    }
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
  submitError.value = ''

  // =========================
  // 인증 상태 및 입력값 검증
  // =========================
  // 화면 상태가 변조되더라도 인증 전 변경 요청을 만들지 않도록 다시 확인한다.
  if (!isVerified.value) {
    submitError.value = '이메일 인증을 완료해주세요'
    return
  }

  if (!isValidPassword(newPassword.value)) {
    submitError.value = '2가지 조합은 10자리, 3가지 조합은 8자리 이상 입력해주세요'
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    submitError.value = '비밀번호가 일치하지 않습니다'
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
    isComplete.value = true
  } catch (error) {
    submitError.value =
      error.response?.data?.message ?? '비밀번호 변경에 실패했습니다'
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
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <main
    class="relative min-h-svh w-full bg-(--color-app-bg) px-[22px] pt-[calc(var(--header-height)+var(--space-4))] pb-12"
  >
    <section
      v-if="isComplete"
      class="flex min-h-[calc(100svh-var(--header-height)-var(--space-8))] flex-col items-center text-center"
      aria-labelledby="reset-complete-title"
    >
      <AewolLogo
        size="22"
        class="self-start"
      />
      <StatusVisual
        size="126"
        class="mt-auto"
      />
      <h1
        id="reset-complete-title"
        class="mt-(--auth-success-title-gap) text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        비밀번호가 변경됐어요
      </h1>
      <p class="mt-2 text-(length:--font-md) leading-[1.3] text-(color:--color-slate-muted)">
        새 비밀번호로 다시 로그인해주세요
      </p>
      <router-link
        class="mt-auto flex h-[52px] w-full items-center justify-center rounded-[20px] bg-(--color-leaf) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
        to="/login"
      >
        로그인하러 가기
      </router-link>
    </section>

    <template v-else>
      <div
        class="fixed inset-x-0 top-0 z-100 h-(--header-height) bg-(--color-app-bg)"
        aria-hidden="true"
      />
      <button
        class="fixed top-(--space-2) left-(--space-4) z-101 flex size-10 items-center justify-center text-(color:--color-navy)"
        type="button"
        aria-label="이전 화면으로 돌아가기"
        @click="router.back()"
      >
        <IconArrowLeft size="24" />
      </button>

      <header>
        <h1 class="text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)">
          비밀번호 찾기
        </h1>
        <p class="mt-0.5 text-(length:--font-md) leading-[1.45] text-(color:--color-slate-muted)">
          가입하신 이메일로 본인 확인 후<br>바로 새 비밀번호를 설정해요
        </p>
      </header>

      <section
        class="mt-[22px]"
        aria-label="이메일 인증"
      >
        <label
          class="mb-1 block text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="reset-email"
        >
          이메일
        </label>
        <div class="flex gap-(--space-2)">
          <input
            id="reset-email"
            v-model.trim="email"
            class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:opacity-65"
            type="email"
            autocomplete="email"
            placeholder="example@aewol.com"
            :disabled="isVerified"
          >
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[11.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            :disabled="isLoading || isVerified"
            @click="handleRequestCode"
          >
            {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>
        <p
          v-if="emailMessage.text"
          class="mt-1 text-[11px]"
          :class="
            emailMessage.type === 'success'
              ? 'text-(color:--color-olive)'
              : 'text-(color:--color-danger-strong)'
          "
          role="alert"
        >
          {{ emailMessage.text }}
        </p>

        <label
          class="mt-[11px] mb-1 block text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="verification-code"
        >
          인증번호
        </label>
        <div class="flex gap-(--space-2)">
          <div class="relative min-w-0 flex-1">
            <input
              id="verification-code"
              v-model="verificationCode"
              class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] pr-[70px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:opacity-65"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="6자리 숫자 입력"
              :disabled="isVerified"
            >
            <span
              v-if="isCodeSent && !isVerified"
              class="absolute top-1/2 right-[14px] -translate-y-1/2 text-[11.5px] font-(--font-bold) text-(color:--color-gold)"
            >
              {{ formattedTime }}
            </span>
          </div>
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            :disabled="isLoading || isVerified"
            @click="handleVerifyCode"
          >
            확인
          </button>
        </div>
        <p
          v-if="codeMessage.text"
          class="mt-1 text-[11px]"
          :class="
            codeMessage.type === 'success'
              ? 'text-(color:--color-olive)'
              : 'text-(color:--color-danger-strong)'
          "
          role="alert"
        >
          {{ codeMessage.text }}
        </p>
      </section>

      <section
        v-if="isVerified"
        aria-label="새 비밀번호 설정"
      >
        <div class="relative mt-[14px] h-7">
          <div class="absolute top-[13px] right-0 left-0 h-px bg-(--color-border)" />
          <span
            class="absolute top-[5px] left-1/2 -translate-x-1/2 bg-(--color-app-bg) px-2 text-[11.5px] font-(--font-bold) whitespace-nowrap text-(color:--color-slate-muted)"
          >
            인증 완료 후 새 비밀번호 설정
          </span>
        </div>

        <form
          class="flex flex-col"
          @submit.prevent="handleResetPassword"
        >
          <label
            class="mb-1 block text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
            for="new-password"
          >
            새 비밀번호
          </label>
          <PasswordInput
            id="new-password"
            v-model="newPassword"
            input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
            autocomplete="new-password"
            placeholder="2가지 조합 10자리 / 3가지 조합 8자리 이상"
            required
          />
          <p
            v-if="newPassword && !isNewPasswordValid"
            class="mt-1 text-[11px] text-(color:--color-danger-strong)"
            role="alert"
          >
            영문·숫자·특수문자 중 2가지 조합은 10자리, 3가지 조합은 8자리 이상 입력해 주세요.
          </p>
          <p
            v-else-if="newPassword && isNewPasswordValid"
            class="mt-1 text-[11px] text-(color:--color-olive)"
          >
            사용 가능한 비밀번호입니다.
          </p>

          <label
            class="mt-[11px] mb-1 block text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
            for="new-password-confirm"
          >
            새 비밀번호 확인
          </label>
          <PasswordInput
            id="new-password-confirm"
            v-model="newPasswordConfirm"
            input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
            autocomplete="new-password"
            placeholder="비밀번호를 한번 더 입력해주세요"
            required
          />
          <p
            v-if="newPasswordConfirm && !isNewPasswordConfirmed"
            class="mt-1 text-[11px] text-(color:--color-danger-strong)"
            role="alert"
          >
            비밀번호가 일치하지 않습니다.
          </p>
          <p
            v-else-if="newPasswordConfirm && isNewPasswordConfirmed"
            class="mt-1 text-[11px] text-(color:--color-olive)"
          >
            비밀번호가 일치합니다.
          </p>

          <p
            v-if="submitError"
            class="mt-3 text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
            role="alert"
          >
            {{ submitError }}
          </p>

          <button
            class="mt-6 h-[52px] rounded-(--radius-xl) bg-(--color-leaf) text-[14.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? '변경 중...' : '비밀번호 변경하기' }}
          </button>
        </form>
      </section>

      <router-link
        class="mt-[15px] block text-center text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        to="/login"
      >
        로그인으로 돌아가기
      </router-link>
    </template>
  </main>
</template>
