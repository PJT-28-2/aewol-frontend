<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatCountdown } from '@/utils/date'
import { formatPhoneNumber } from '@/utils/phone'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import successImage from '@/assets/images/pet-success.png'

const router = useRouter()

const name = ref('')
const phone = ref('')
const verificationCode = ref('')
const isCodeSent = ref(false)
const isVerified = ref(false)
const isResultVisible = ref(false)
const foundEmail = ref('')
const remainingSeconds = ref(0)
const phoneMessage = ref({ type: 'error', text: '' })
const codeMessage = ref({ type: 'error', text: '' })
const submitError = ref('')
// API 연결 전 화면 검수를 위한 개발 전용 인증 우회 플래그다.
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
/**
 * 입력값에서 숫자만 남겨 전화번호 형식(하이픈)으로 다시 채운다.
 *
 * @param {Event} event 전화번호 입력 이벤트
 * @returns {void}
 */
const handlePhoneInput = (event) => {
  phone.value = formatPhoneNumber(event.target.value)
}

const handleRequestCode = () => {
  // =========================
  // 입력값 검증
  // =========================
  if (!name.value.trim()) {
    phoneMessage.value = { type: 'error', text: '이름을 입력해주세요' }
    return
  }

  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value)) {
    phoneMessage.value = { type: 'error', text: '올바른 전화번호 형식이 아닙니다' }
    return
  }

  // 운영 API 경로를 임의로 생성하면 계약 불일치 위험이 있어 명세 확정 전 호출을 차단한다.
  if (!isDevelopmentPreview) {
    phoneMessage.value = {
      type: 'error',
      text: '아이디 찾기 인증 API 연결이 필요합니다',
    }
    return
  }

  // =========================
  // 개발용 화면 상태 업데이트
  // =========================
  // 재전송 시 이전 인증 결과를 폐기하여 실제 인증 흐름과 같은 상태로 되돌린다.
  isCodeSent.value = true
  isVerified.value = false
  verificationCode.value = ''
  codeMessage.value = { type: 'error', text: '' }
  startTimer()
  phoneMessage.value = { type: 'success', text: '개발용 인증번호는 123456입니다' }
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
    codeMessage.value = { type: 'error', text: '인증번호가 일치하지 않습니다' }
    return
  }

  if (isDevelopmentPreview && verificationCode.value === '123456') {
    // 운영 빌드에 우회가 포함되지 않도록 DEV 플래그와 고정 번호를 함께 검사한다.
    isVerified.value = true
    window.clearInterval(timerId)
    codeMessage.value = { type: 'success', text: '인증되었습니다' }
    return
  }

  // 운영 환경에서는 발송하지 않은 번호를 검증하지 않도록 선제적으로 차단한다.
  if (!isDevelopmentPreview && !isCodeSent.value) {
    codeMessage.value = { type: 'error', text: '인증번호를 먼저 받아주세요' }
    return
  }

  codeMessage.value = { type: 'error', text: '인증번호가 일치하지 않습니다' }
}

/**
 * 인증된 사용자의 가입 이메일을 결과 화면에 표시한다.
 * API 명세 확정 전에는 개발용 응답으로 마스킹 UI만 검수한다.
 *
 * @returns {void}
 */
const handleFindId = () => {
  submitError.value = ''

  // 상태가 임의로 변경되더라도 인증 전 결과 화면으로 넘어가지 않도록 다시 확인한다.
  if (!isVerified.value) {
    submitError.value = '본인 인증을 완료해주세요'
    return
  }

  // TODO: 아이디 찾기 API 명세 확정 후 서버가 반환한 이메일로 교체한다.
  // 현재 값은 결과 화면과 마스킹 동작을 검수하기 위한 개발용 응답이다.
  foundEmail.value = 'honggildong@aewol.com'

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
 * 화면 종료 후 인증 타이머를 정리한다.
 * 언마운트된 화면에서 상태가 변경되는 문제와 불필요한 메모리 점유를 방지한다.
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
    class="relative min-h-svh w-full bg-(--color-white) px-[22px] pt-[calc(var(--header-height)+var(--space-4))] pb-12"
  >
    <section
      v-if="isResultVisible"
      class="text-center"
      aria-labelledby="find-id-result-title"
    >
      <img
        class="mx-auto mt-(--auth-success-find-id-image-offset) size-(--auth-success-image-size) object-cover"
        :src="successImage"
        alt=""
      >
      <h1
        id="find-id-result-title"
        class="mt-(--auth-success-title-gap) text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        본인 확인이 완료됐어요
      </h1>
      <p class="mt-2 text-(length:--font-md) leading-[1.3] text-(color:--color-slate-muted)">
        {{ name || '홍길동' }}님의 가입 이메일이에요
      </p>
      <div
        class="mt-[27px] flex h-[66px] items-center justify-center rounded-(--radius-xl) bg-(--color-surface) text-(length:--font-base) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        {{ maskedEmail }}
      </div>
      <router-link
        class="mt-6 flex h-[52px] items-center justify-center rounded-(--radius-xl) bg-(--color-gold) text-[14.5px] font-(--font-bold) text-(color:--color-navy)"
        to="/login"
      >
        로그인하러 가기
      </router-link>
      <router-link
        class="mt-[11px] block text-[11.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
        to="/password/reset"
      >
        비밀번호를 잊으셨나요? 비밀번호 찾기
      </router-link>
    </section>

    <template v-else>
      <div
        class="fixed inset-x-0 top-0 z-100 h-(--header-height) bg-(--color-white)"
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
          아이디 찾기
        </h1>
        <p class="mt-0.5 text-(length:--font-md) leading-[1.45] text-(color:--color-slate-muted)">
          이름과 전화번호로 본인 확인 후<br>가입하신 이메일을 알려드려요
        </p>
      </header>

      <form
        class="mt-[22px] flex flex-col"
        @submit.prevent="handleFindId"
      >
        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-id-name"
        >
          이름
        </label>
        <input
          id="find-id-name"
          v-model.trim="name"
          class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="text"
          autocomplete="name"
          placeholder="홍길동"
        >

        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-id-phone"
        >
          전화번호
        </label>
        <div class="flex gap-(--space-2)">
          <input
            id="find-id-phone"
            :value="phone"
            class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
            type="tel"
            autocomplete="tel"
            placeholder="010-1234-5678"
            @input="handlePhoneInput"
          >
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[11.5px] font-(--font-bold) text-(color:--color-white) disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            :disabled="isVerified"
            @click="handleRequestCode"
          >
            {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>
        <p
          v-if="phoneMessage.text"
          class="mt-1 text-[11px]"
          :class="
            phoneMessage.type === 'success'
              ? 'text-(color:--color-olive)'
              : 'text-(color:--color-danger-strong)'
          "
          role="alert"
        >
          {{ phoneMessage.text }}
        </p>

        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-id-code"
        >
          인증번호
        </label>
        <div class="flex gap-(--space-2)">
          <div class="relative min-w-0 flex-1">
            <input
              id="find-id-code"
              v-model="verificationCode"
              class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] pr-[70px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) disabled:opacity-65"
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
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[12.5px] font-(--font-bold) text-(color:--color-white) disabled:opacity-55"
            type="button"
            :disabled="isVerified"
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

        <p
          v-if="submitError"
          class="mt-3 text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ submitError }}
        </p>

        <button
          class="mt-6 h-[52px] rounded-(--radius-xl) bg-(--color-gold) text-[14.5px] font-(--font-bold) text-(color:--color-navy)"
          type="submit"
        >
          아이디 찾기
        </button>
      </form>

      <router-link
        class="mt-[15px] block text-center text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        to="/login"
      >
        로그인으로 돌아가기
      </router-link>
    </template>
  </main>
</template>
