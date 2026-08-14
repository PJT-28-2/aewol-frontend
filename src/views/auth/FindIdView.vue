<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { formatCountdown } from '@/utils/date'
import { formatPhoneNumber } from '@/utils/phone'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import StatusVisual from '@/components/common/StatusVisual.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'

const router = useRouter()
const name = ref('')
const phone = ref('')
const verificationCode = ref('')
const requestId = ref('')
const remainingSeconds = ref(0)
const isCodeSent = ref(false)
const isSending = ref(false)
const isVerifying = ref(false)
const isResultVisible = ref(false)
const resultProvider = ref('')
const maskedEmail = ref('')
const nameMessage = ref({ type: 'error', text: '' })
const phoneMessage = ref({ type: 'error', text: '' })
const codeMessage = ref({ type: 'error', text: '' })
let timerId

const formattedTime = computed(() => formatCountdown(remainingSeconds.value))

const startTimer = (expiresInSeconds) => {
  window.clearInterval(timerId)
  remainingSeconds.value = expiresInSeconds
  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      window.clearInterval(timerId)
      remainingSeconds.value = 0
      codeMessage.value = {
        type: 'error',
        text: '인증번호가 만료되었습니다. 다시 받아주세요',
      }
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

const handlePhoneInput = (event) => {
  phone.value = formatPhoneNumber(event.target.value)
}

const handleVerificationCodeInput = (event) => {
  verificationCode.value = event.target.value.replace(/\D/g, '').slice(0, 6)
}

const resetVerificationSession = () => {
  window.clearInterval(timerId)
  requestId.value = ''
  verificationCode.value = ''
  isCodeSent.value = false
  remainingSeconds.value = 0
  codeMessage.value = { type: 'error', text: '' }
  resultProvider.value = ''
  maskedEmail.value = ''
  isResultVisible.value = false
}

const handleRequestCode = async () => {
  if (isSending.value || isVerifying.value) return

  nameMessage.value = { type: 'error', text: '' }
  phoneMessage.value = { type: 'error', text: '' }

  if (!name.value.trim()) {
    nameMessage.value = { type: 'error', text: '이름을 입력해주세요' }
    return
  }
  if (!/^010-?\d{4}-?\d{4}$/.test(phone.value)) {
    phoneMessage.value = { type: 'error', text: '올바른 전화번호 형식이 아닙니다' }
    return
  }

  resetVerificationSession()
  isSending.value = true
  try {
    const phoneDigits = phone.value.replace(/\D/g, '')
    const { data } = await authApi.requestFindAccountCode(name.value.trim(), phoneDigits)
    const nextRequestId = data?.result?.requestId
    const expiresInSeconds = data?.result?.expiresInSeconds
    if (typeof nextRequestId !== 'string' || !nextRequestId.trim()
      || typeof expiresInSeconds !== 'number' || !Number.isFinite(expiresInSeconds)
      || expiresInSeconds <= 0) {
      phoneMessage.value = { type: 'error', text: '인증번호 전송 결과를 확인할 수 없습니다' }
      return
    }

    requestId.value = nextRequestId
    isCodeSent.value = true
    verificationCode.value = ''
    resultProvider.value = ''
    maskedEmail.value = ''
    isResultVisible.value = false
    codeMessage.value = { type: 'error', text: '' }
    startTimer(expiresInSeconds)
    phoneMessage.value = {
      type: 'success',
      text: data.message ?? '인증번호를 전송했습니다',
    }
  } catch (error) {
    phoneMessage.value = {
      type: 'error',
      text: error.response?.data?.message ?? '인증번호 전송에 실패했습니다',
    }
  } finally {
    isSending.value = false
  }
}

const handleVerifyCode = async () => {
  if (isSending.value || isVerifying.value) return

  codeMessage.value = { type: 'error', text: '' }
  if (!requestId.value) {
    codeMessage.value = { type: 'error', text: '인증번호를 먼저 받아주세요' }
    return
  }
  if (!/^\d{6}$/.test(verificationCode.value)) {
    codeMessage.value = { type: 'error', text: '인증번호 6자리를 입력해주세요' }
    return
  }
  if (remainingSeconds.value === 0) {
    codeMessage.value = { type: 'error', text: '인증번호가 만료되었습니다. 다시 받아주세요' }
    return
  }
  isVerifying.value = true
  try {
    const { data } = await authApi.verifyFindAccountCode(requestId.value, verificationCode.value)
    const provider = data?.result?.provider
    const email = data?.result?.maskedEmail
    if (provider !== 'LOCAL' && provider !== 'KAKAO') {
      codeMessage.value = { type: 'error', text: '인증 결과를 확인할 수 없습니다' }
      return
    }
    if (provider === 'LOCAL' && (typeof email !== 'string' || !email.trim())) {
      codeMessage.value = { type: 'error', text: '계정 정보를 확인할 수 없습니다' }
      return
    }

    resultProvider.value = provider
    maskedEmail.value = provider === 'LOCAL' ? email : ''
    window.clearInterval(timerId)
    remainingSeconds.value = 0
    isResultVisible.value = true
  } catch (error) {
    codeMessage.value = {
      type: 'error',
      text: error.response?.data?.message ?? '인증번호 확인에 실패했습니다',
    }
  } finally {
    isVerifying.value = false
  }
}

onBeforeUnmount(() => window.clearInterval(timerId))
</script>

<template>
  <main class="relative min-h-svh w-full bg-(--color-app-bg) px-[22px] pt-[calc(var(--header-height)+var(--space-4))] pb-12">
    <section
      v-if="isResultVisible"
      class="flex min-h-[calc(100svh-var(--header-height)-var(--space-8))] flex-col items-center text-center"
      aria-labelledby="find-account-result-title"
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
        id="find-account-result-title"
        class="mt-(--auth-success-title-gap) text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        본인 확인이 완료됐어요
      </h1>
      <p class="mt-2 text-(length:--font-md) leading-[1.5] text-(color:--color-slate-muted)">
        <template v-if="resultProvider === 'LOCAL'">
          가입하신 이메일은
        </template>
        <template v-else>
          카카오 계정으로 가입한 회원입니다.<br>카카오로 로그인해 주세요.
        </template>
      </p>
      <div
        v-if="resultProvider === 'LOCAL'"
        class="mt-[27px] flex h-[66px] w-full items-center justify-center rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) text-(length:--font-base) leading-[1.3] font-(--font-bold) text-(color:--color-navy) shadow-(--shadow-card)"
      >
        {{ maskedEmail }} 입니다.
      </div>
      <router-link
        class="mt-auto flex h-[52px] w-full items-center justify-center rounded-[20px] bg-(--color-leaf) text-[14.5px] font-(--font-bold) text-(color:--color-navy)"
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
          계정 찾기
        </h1>
        <p class="mt-0.5 text-(length:--font-md) leading-[1.45] text-(color:--color-slate-muted)">
          이름과 전화번호로 본인 확인 후<br>가입하신 계정을 알려드려요
        </p>
      </header>

      <form
        class="mt-[22px] flex flex-col"
        @submit.prevent="handleVerifyCode"
      >
        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-account-name"
        >이름</label>
        <input
          id="find-account-name"
          v-model.trim="name"
          class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:opacity-65"
          type="text"
          autocomplete="name"
          placeholder="홍길동"
          :disabled="isSending || isVerifying"
        >
        <p
          v-if="nameMessage.text"
          class="mt-1 text-[11px] text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ nameMessage.text }}
        </p>

        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-account-phone"
        >전화번호</label>
        <div class="flex gap-(--space-2)">
          <input
            id="find-account-phone"
            :value="phone"
            class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:opacity-65"
            type="tel"
            autocomplete="tel"
            placeholder="010-1234-5678"
            :disabled="isSending || isVerifying"
            @input="handlePhoneInput"
          >
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[11.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            :disabled="isSending || isVerifying"
            @click="handleRequestCode"
          >
            {{ isSending ? '전송 중...' : isCodeSent ? '다시 받기' : '인증번호 받기' }}
          </button>
        </div>
        <p
          v-if="phoneMessage.text"
          class="mt-1 text-[11px]"
          :class="phoneMessage.type === 'success' ? 'text-(color:--color-olive)' : 'text-(color:--color-danger-strong)'"
          role="alert"
        >
          {{ phoneMessage.text }}
        </p>

        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="find-account-code"
        >인증번호</label>
        <div class="flex gap-(--space-2)">
          <div class="relative min-w-0 flex-1">
            <input
              id="find-account-code"
              :value="verificationCode"
              class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] pr-[70px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:opacity-65"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="6자리 숫자 입력"
              :disabled="!isCodeSent || remainingSeconds === 0 || isVerifying"
              @input="handleVerificationCodeInput"
            >
            <span
              v-if="isCodeSent"
              class="absolute top-1/2 right-[14px] -translate-y-1/2 text-[11.5px] font-(--font-bold) text-(color:--color-gold)"
            >{{ formattedTime }}</span>
          </div>
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
            :disabled="!requestId || verificationCode.length !== 6 || remainingSeconds === 0 || isSending || isVerifying"
          >
            {{ isVerifying ? '확인 중...' : '확인' }}
          </button>
        </div>
        <p
          v-if="codeMessage.text"
          class="mt-1 text-[11px] text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ codeMessage.text }}
        </p>
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
