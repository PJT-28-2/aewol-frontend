<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
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
  <main
    class="relative mx-auto min-h-svh w-[min(100%,390px)] overflow-hidden rounded-[40px] bg-(--color-white) px-[22px] pt-[108px] pb-12 min-[391px]:my-[max(0px,calc((100svh-844px)/2))] min-[391px]:min-h-[844px] min-[391px]:shadow-(--shadow-lg)"
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
      />
      <h1
        id="find-id-result-title"
        class="mt-(--auth-success-title-gap) text-[18px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        본인 확인이 완료됐어요
      </h1>
      <p class="mt-2 text-[12.5px] leading-[1.3] text-(color:--color-slate-muted)">
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
      <button
        class="absolute top-[60px] left-[22px] size-[26px] text-(color:--color-navy)"
        type="button"
        aria-label="이전 화면으로 돌아가기"
        @click="router.back()"
      >
        <IconArrowLeft :size="26" />
      </button>

      <header>
        <h1 class="text-[22px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)">
          아이디 찾기
        </h1>
        <p class="mt-0.5 text-[12.5px] leading-[1.45] text-(color:--color-slate-muted)">
          이름과 전화번호로 본인 확인 후<br />가입하신 이메일을 알려드려요
        </p>
      </header>

      <form class="mt-[22px] flex flex-col" @submit.prevent="handleFindId">
        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-id-name"
        >
          이름
        </label>
        <input
          id="find-id-name"
          v-model.trim="name"
          class="mb-[11px] h-[46px] w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="text"
          autocomplete="name"
          placeholder="홍길동"
        />

        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-id-phone"
        >
          전화번호
        </label>
        <div class="mb-[31px] grid grid-cols-[minmax(0,240px)_90px] gap-4">
          <input
            id="find-id-phone"
            v-model.trim="phone"
            class="h-[46px] w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
            type="tel"
            autocomplete="tel"
            placeholder="010-1234-5678"
          />
          <button
            class="h-[46px] rounded-(--radius-lg) bg-(--color-navy) text-[11.5px] font-(--font-bold) text-(color:--color-white) disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            :disabled="isVerified"
            @click="handleRequestCode"
          >
            {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>

        <div class="flex justify-between">
          <label
            class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
            for="find-id-code"
          >
            인증번호
          </label>
          <span
            v-if="isCodeSent && !isVerified"
            class="text-(length:--font-sm) font-(--font-bold) text-(color:--color-gold)"
          >
            {{ formattedTime }}
          </span>
        </div>
        <div class="grid grid-cols-[minmax(0,270px)_60px] gap-4">
          <input
            id="find-id-code"
            v-model="verificationCode"
            class="h-[46px] w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) disabled:opacity-65"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="6자리 숫자 입력"
            :disabled="isVerified"
          />
          <button
            class="h-[46px] rounded-(--radius-lg) bg-(--color-navy) text-[12.5px] font-(--font-bold) text-(color:--color-white) disabled:opacity-55"
            type="button"
            :disabled="isVerified"
            @click="handleVerifyCode"
          >
            확인
          </button>
        </div>

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

      <Teleport to="body">
        <Transition
          enter-active-class="transition-[opacity,transform] duration-200 ease-out"
          enter-from-class="-translate-y-3 opacity-0"
          leave-active-class="transition-[opacity,transform] duration-200 ease-in"
          leave-to-class="-translate-y-3 opacity-0"
        >
          <div
            v-if="toast.visible"
            class="fixed top-7 left-1/2 z-[1100] flex min-h-14 w-[min(calc(100%-44px),346px)] -translate-x-1/2 items-center gap-2 rounded-[14px] border border-(--color-border) bg-(--color-white) px-4 py-3 text-[12.5px] font-(--font-bold) shadow-(--shadow-lg)"
            :class="
              toast.type === 'success'
                ? 'text-(color:--color-olive)'
                : 'text-(color:--color-danger-strong)'
            "
            role="alert"
            aria-live="assertive"
          >
            <span
              class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]"
              :class="
                toast.type === 'success'
                  ? 'bg-(--color-pastel-green)'
                  : 'bg-(--color-danger-soft)'
              "
              aria-hidden="true"
            >
              {{ toast.type === 'success' ? '✓' : '!' }}
            </span>
            <span>{{ toast.message }}</span>
          </div>
        </Transition>
      </Teleport>
    </template>
  </main>
</template>
