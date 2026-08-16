<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { usePetStore } from '@/stores/pet'
import { formatCountdown } from '@/utils/date'
import { formatPhoneNumber } from '@/utils/phone'
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'

const router = useRouter()
const authStore = useAuthStore()
const petStore = usePetStore()

const phone = ref('')
const verificationCode = ref('')
const remainingSeconds = ref(0)
const isCodeSent = ref(false)
const isPhoneVerified = ref(false)
const isSending = ref(false)
const isVerifying = ref(false)
const isAddressSearchOpen = ref(false)
const isSubmitting = ref(false)
const phoneMessage = ref({ type: 'error', text: '' })
const codeMessage = ref({ type: 'error', text: '' })
const signupMessage = ref('')
const address = reactive({
  zipCode: '',
  address: '',
  addressDetail: '',
})
const agreements = reactive({
  terms: false,
  privacy: false,
  marketing: false,
})
let timerId
let sendRequestId = 0
let verifyRequestId = 0

const phoneDigits = computed(() => phone.value.replace(/\D/g, ''))
const isPhoneValid = computed(() => /^010\d{8}$/.test(phoneDigits.value))
const formattedTime = computed(() => formatCountdown(remainingSeconds.value))
const canVerify = computed(
  () =>
    isCodeSent.value &&
    remainingSeconds.value > 0 &&
    /^\d{6}$/.test(verificationCode.value) &&
    !isSending.value &&
    !isVerifying.value &&
    !isPhoneVerified.value,
)
const isAllAgreed = computed(
  () => agreements.terms && agreements.privacy && agreements.marketing,
)
const isAddressValid = computed(() => {
  const zipCode = address.zipCode.trim()
  const baseAddress = address.address.trim()
  return (
    zipCode.length > 0 &&
    zipCode.length <= 10 &&
    baseAddress.length > 0 &&
    baseAddress.length <= 300 &&
    address.addressDetail.trim().length <= 100
  )
})
const isSignupDisabled = computed(
  () =>
    isSubmitting.value ||
    !isPhoneVerified.value ||
    !isAddressValid.value ||
    !agreements.terms ||
    !agreements.privacy,
)

const clearTimer = () => {
  window.clearInterval(timerId)
  timerId = undefined
}

const startTimer = (expiresInSeconds) => {
  clearTimer()
  remainingSeconds.value = Math.floor(expiresInSeconds)
  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      clearTimer()
      remainingSeconds.value = 0
      codeMessage.value = {
        type: 'error',
        text: '인증번호가 만료되었습니다. 다시 받아주세요.',
      }
      return
    }

    remainingSeconds.value -= 1
  }, 1000)
}

const resetVerificationState = () => {
  clearTimer()
  verifyRequestId += 1
  verificationCode.value = ''
  remainingSeconds.value = 0
  isCodeSent.value = false
  isPhoneVerified.value = false
  isVerifying.value = false
  codeMessage.value = { type: 'error', text: '' }
}

const handlePhoneInput = (value) => {
  const nextPhone = formatPhoneNumber(value)
  if (nextPhone === phone.value) return

  phone.value = nextPhone
  sendRequestId += 1
  isSending.value = false
  phoneMessage.value = { type: 'error', text: '' }
  resetVerificationState()
}

const normalizePhoneInputValue = (event) => {
  event.target.value = formatPhoneNumber(event.target.value)
}

const handleVerificationCodeInput = (value) => {
  if (isPhoneVerified.value) return
  verificationCode.value = value.replace(/\D/g, '').slice(0, 6)
  codeMessage.value = { type: 'error', text: '' }
}

const normalizeVerificationCodeInputValue = (event) => {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6)
}

const getSmsErrorMessage = (error, action) => {
  if (!error.response) {
    return '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
  }

  const status = error.response.status
  if (status === 400) {
    return action === 'send'
      ? '전화번호 형식을 확인해주세요.'
      : '인증번호를 확인해주세요.'
  }
  if (status === 409) return '이미 가입된 전화번호입니다.'
  if (status === 429) {
    return '인증번호 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }
  if (status === 503) {
    return '인증 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.'
  }

  return action === 'send'
    ? '인증번호 전송에 실패했습니다.'
    : '인증번호 확인에 실패했습니다.'
}

const handleRequestCode = async () => {
  if (isSending.value || isVerifying.value || isPhoneVerified.value) return

  phoneMessage.value = { type: 'error', text: '' }
  if (!isPhoneValid.value) {
    phoneMessage.value = {
      type: 'error',
      text: '010으로 시작하는 휴대폰 번호를 입력해주세요.',
    }
    return
  }

  const registrationToken = authStore.registrationToken
  if (!registrationToken) {
    authStore.clearKakaoRegistration()
    await router.replace('/login')
    return
  }

  const requestedPhone = phoneDigits.value
  const currentRequestId = ++sendRequestId
  isSending.value = true

  try {
    const { data } = await authApi.sendKakaoSignupPhoneCode(
      registrationToken,
      requestedPhone,
    )
    if (
      currentRequestId !== sendRequestId ||
      requestedPhone !== phoneDigits.value
    ) {
      return
    }

    const expiresInSeconds = data?.result?.expiresInSeconds
    if (
      typeof expiresInSeconds !== 'number' ||
      !Number.isFinite(expiresInSeconds) ||
      expiresInSeconds <= 0
    ) {
      phoneMessage.value = {
        type: 'error',
        text: '인증번호 전송 결과를 확인할 수 없습니다.',
      }
      return
    }

    verificationCode.value = ''
    isCodeSent.value = true
    isPhoneVerified.value = false
    codeMessage.value = { type: 'error', text: '' }
    phoneMessage.value = {
      type: 'success',
      text: '인증번호를 전송했습니다.',
    }
    startTimer(expiresInSeconds)
  } catch (error) {
    if (currentRequestId === sendRequestId) {
      phoneMessage.value = {
        type: 'error',
        text: getSmsErrorMessage(error, 'send'),
      }
    }
  } finally {
    if (currentRequestId === sendRequestId) {
      isSending.value = false
    }
  }
}

const handleVerifyCode = async () => {
  if (isSending.value || isVerifying.value || isPhoneVerified.value) return

  codeMessage.value = { type: 'error', text: '' }
  if (!isCodeSent.value) {
    codeMessage.value = {
      type: 'error',
      text: '인증번호를 먼저 받아주세요.',
    }
    return
  }
  if (remainingSeconds.value === 0) {
    codeMessage.value = {
      type: 'error',
      text: '인증번호가 만료되었습니다. 다시 받아주세요.',
    }
    return
  }
  if (!/^\d{6}$/.test(verificationCode.value)) {
    codeMessage.value = {
      type: 'error',
      text: '인증번호 6자리를 입력해주세요.',
    }
    return
  }

  const registrationToken = authStore.registrationToken
  if (!registrationToken) {
    authStore.clearKakaoRegistration()
    await router.replace('/login')
    return
  }

  const requestedCode = verificationCode.value
  const currentRequestId = ++verifyRequestId
  isVerifying.value = true

  try {
    await authApi.verifyKakaoSignupPhoneCode(
      registrationToken,
      requestedCode,
    )
    if (
      currentRequestId !== verifyRequestId ||
      requestedCode !== verificationCode.value
    ) {
      return
    }

    clearTimer()
    remainingSeconds.value = 0
    isPhoneVerified.value = true
    codeMessage.value = {
      type: 'success',
      text: '전화번호 인증이 완료되었습니다.',
    }
  } catch (error) {
    if (currentRequestId === verifyRequestId) {
      codeMessage.value = {
        type: 'error',
        text: getSmsErrorMessage(error, 'verify'),
      }
    }
  } finally {
    if (currentRequestId === verifyRequestId) {
      isVerifying.value = false
    }
  }
}

const toggleAllAgreements = () => {
  const nextValue = !isAllAgreed.value
  agreements.terms = nextValue
  agreements.privacy = nextValue
  agreements.marketing = nextValue
}

const handleAddressSelect = ({ zipCode, address: selectedAddress }) => {
  address.zipCode = zipCode
  address.address = selectedAddress
  signupMessage.value = ''
}

const getSignupErrorMessage = (error) => {
  if (!error.response) {
    return error.request
      ? '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
      : '회원가입을 완료하지 못했습니다.'
  }

  const status = error.response.status
  if (status === 400) return '입력한 주소와 약관 정보를 확인해주세요.'
  if (status === 409) return '이미 가입되었거나 사용 중인 정보가 있습니다.'
  if (status === 503) {
    return '회원가입 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.'
  }

  return '회원가입을 완료하지 못했습니다.'
}

const resolvePostLoginPath = async () => {
  try {
    const pets = await petStore.fetchPets()
    return pets.length === 0 ? '/share/start' : '/home'
  } catch {
    return '/home'
  }
}

const handleCompleteSignup = async () => {
  if (isSubmitting.value) return

  signupMessage.value = ''
  if (!isPhoneVerified.value) {
    signupMessage.value = '전화번호 인증을 완료해주세요.'
    return
  }
  if (!authStore.registrationToken) {
    authStore.clearKakaoRegistration()
    await router.replace('/login')
    return
  }

  const zipCode = address.zipCode.trim()
  const baseAddress = address.address.trim()
  const addressDetail = address.addressDetail.trim()
  if (!zipCode || !baseAddress) {
    signupMessage.value = '주소를 입력해주세요.'
    return
  }
  if (zipCode.length > 10 || baseAddress.length > 300) {
    signupMessage.value = '입력한 주소를 확인해주세요.'
    return
  }
  if (addressDetail.length > 100) {
    signupMessage.value = '상세주소는 100자 이하로 입력해주세요.'
    return
  }
  if (!agreements.terms || !agreements.privacy) {
    signupMessage.value = '필수 약관에 동의해주세요.'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.completeKakaoSignup({
      zipCode,
      address: baseAddress,
      addressDetail,
      terms: agreements.terms,
      privacy: agreements.privacy,
      marketing: agreements.marketing,
    })
    await router.replace(await resolvePostLoginPath())
  } catch (error) {
    signupMessage.value = getSignupErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = async () => {
  if (isSubmitting.value) return
  authStore.clearKakaoRegistration()
  await router.replace('/login')
}

onBeforeUnmount(() => {
  sendRequestId += 1
  verifyRequestId += 1
  clearTimer()
})
</script>

<template>
  <main
    class="mx-auto min-h-svh w-full max-w-[390px] bg-(--color-app-bg) px-(--space-5) pt-[calc(var(--header-height)+var(--space-4))] pb-(--space-6)"
  >
    <div
      class="fixed inset-x-0 top-0 z-100 h-(--header-height) bg-(--color-app-bg)"
      aria-hidden="true"
    />
    <button
      class="fixed top-(--space-2) left-(--space-4) z-101 flex size-10 items-center justify-center text-(color:--color-navy)"
      type="button"
      aria-label="로그인 화면으로 돌아가기"
      :disabled="isSubmitting"
      @click="handleCancel"
    >
      <IconArrowLeft size="24" />
    </button>

    <header>
      <AewolLogo size="22" />
      <h1
        class="mt-(--space-6) text-(length:--font-2xl) leading-(--line-height-tight) font-(--font-bold) text-(color:--color-navy)"
      >
        추가 정보 입력
      </h1>
      <p
        class="mt-(--space-1) text-(length:--font-md) leading-(--line-height-tight) text-(color:--color-slate-muted)"
      >
        애월 이용에 필요한 정보를 입력해주세요
      </p>
      <p
        class="mt-(--space-4) flex items-center gap-(--space-2) text-(length:--font-sm) font-(--font-semibold) text-(color:--color-olive-dark)"
      >
        <span
          class="flex size-(--space-6) items-center justify-center rounded-(--radius-full) bg-(--color-leaf-soft)"
          aria-hidden="true"
        >
          <IconCheck size="16" />
        </span>
        카카오 계정 연결 완료
      </p>
    </header>

    <section
      class="mt-(--space-8) flex flex-col"
    >
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-2)">
        <AppInput
          :model-value="phone"
          label="전화번호"
          type="tel"
          inputmode="tel"
          maxlength="13"
          placeholder="010-1234-5678"
          required
          @input="normalizePhoneInputValue"
          @update:model-value="handlePhoneInput"
        />
        <AppButton
          class="shrink-0"
          type="button"
          size="md"
          :loading="isSending"
          :disabled="!isPhoneValid || isVerifying || isPhoneVerified"
          @click="handleRequestCode"
        >
          {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
        </AppButton>
      </div>
      <p
        v-if="phoneMessage.text"
        class="mt-(--space-1) text-(length:--font-xs)"
        :class="phoneMessage.type === 'success' ? 'text-(color:--color-olive-dark)' : 'text-(color:--color-danger-strong)'"
        :role="phoneMessage.type === 'success' ? 'status' : 'alert'"
      >
        {{ phoneMessage.text }}
      </p>

      <div class="mt-(--space-6) grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-2)">
        <AppInput
          :model-value="verificationCode"
          label="인증번호"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="6자리 숫자 입력"
          :readonly="!isCodeSent || remainingSeconds === 0 || isVerifying || isPhoneVerified"
          required
          @input="normalizeVerificationCodeInputValue"
          @update:model-value="handleVerificationCodeInput"
        />
        <AppButton
          class="shrink-0"
          type="button"
          size="md"
          :loading="isVerifying"
          :disabled="!canVerify"
          @click="handleVerifyCode"
        >
          {{ isPhoneVerified ? '인증 완료' : '확인' }}
        </AppButton>
      </div>

      <p
        v-if="isPhoneVerified"
        class="mt-(--space-2) flex items-center gap-(--space-1) text-(length:--font-sm) font-(--font-semibold) text-(color:--color-olive-dark)"
        role="status"
      >
        <IconCheck size="16" />
        {{ codeMessage.text }}
      </p>
      <p
        v-else-if="codeMessage.text"
        class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ codeMessage.text }}
      </p>
      <p
        v-else-if="isCodeSent"
        class="mt-(--space-2) text-(length:--font-sm) font-(--font-semibold) text-(color:--color-gold-dark)"
        role="timer"
      >
        남은 시간 {{ formattedTime }}
      </p>
    </section>

    <form
      v-if="isPhoneVerified"
      class="mt-(--space-8) flex flex-col border-t border-(--color-border) pt-(--space-8)"
      novalidate
      @submit.prevent="handleCompleteSignup"
    >
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-2)">
        <AppInput
          :model-value="address.zipCode"
          label="우편번호"
          maxlength="10"
          placeholder="우편번호를 검색하세요"
          readonly
          required
        />
        <AppButton
          class="shrink-0"
          type="button"
          size="md"
          @click="isAddressSearchOpen = true"
        >
          우편번호 찾기
        </AppButton>
      </div>

      <AppInput
        class="mt-(--space-4)"
        :model-value="address.address"
        label="주소"
        maxlength="300"
        placeholder="우편번호 찾기를 눌러 입력해주세요"
        readonly
        required
      />

      <AppInput
        v-model="address.addressDetail"
        class="mt-(--space-4)"
        label="상세주소"
        maxlength="100"
        placeholder="건물, 아파트, 동/호수 입력"
      />

      <fieldset class="mt-(--space-8) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-[18px] py-(--space-4) shadow-(--shadow-card)">
        <legend class="sr-only">
          약관 동의
        </legend>
        <div class="flex items-center justify-between">
          <span class="text-[13px] font-(--font-bold) text-(color:--color-navy)">전체 동의</span>
          <label class="relative flex size-[22px] items-center justify-center">
            <input
              class="peer sr-only"
              type="checkbox"
              :checked="isAllAgreed"
              aria-label="모든 약관에 동의"
              @change="toggleAllAgreements"
            >
            <span
              class="flex size-[22px] items-center justify-center rounded-full border border-(--color-border) bg-(--color-white) text-(color:--color-navy) peer-checked:border-(--color-leaf) peer-checked:bg-(--color-leaf) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
              aria-hidden="true"
            >
              <IconCheck size="13" />
            </span>
          </label>
        </div>
        <label class="mt-[10px] flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <span class="relative flex size-[18px] shrink-0 items-center justify-center">
            <input
              v-model="agreements.terms"
              class="peer sr-only"
              type="checkbox"
            >
            <span
              class="flex size-[18px] items-center justify-center rounded-full border border-(--color-border) bg-(--color-white) text-(color:--color-navy) peer-checked:border-(--color-leaf) peer-checked:bg-(--color-leaf) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
              aria-hidden="true"
            >
              <IconCheck size="11" />
            </span>
          </span>
          <span>(필수) 이용약관 동의</span>
        </label>
        <label class="mt-[10px] flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <span class="relative flex size-[18px] shrink-0 items-center justify-center">
            <input
              v-model="agreements.privacy"
              class="peer sr-only"
              type="checkbox"
            >
            <span
              class="flex size-[18px] items-center justify-center rounded-full border border-(--color-border) bg-(--color-white) text-(color:--color-navy) peer-checked:border-(--color-leaf) peer-checked:bg-(--color-leaf) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
              aria-hidden="true"
            >
              <IconCheck size="11" />
            </span>
          </span>
          <span>(필수) 개인정보 처리방침 동의</span>
        </label>
        <label class="mt-[10px] flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <span class="relative flex size-[18px] shrink-0 items-center justify-center">
            <input
              v-model="agreements.marketing"
              class="peer sr-only"
              type="checkbox"
            >
            <span
              class="flex size-[18px] items-center justify-center rounded-full border border-(--color-border) bg-(--color-white) text-(color:--color-navy) peer-checked:border-(--color-leaf) peer-checked:bg-(--color-leaf) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
              aria-hidden="true"
            >
              <IconCheck size="11" />
            </span>
          </span>
          <span>(선택) 마케팅 정보 수신 동의</span>
        </label>
      </fieldset>

      <p
        v-if="signupMessage"
        class="mt-(--space-3) text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ signupMessage }}
      </p>

      <AppButton
        class="mt-(--space-6)"
        type="submit"
        size="lg"
        block
        :loading="isSubmitting"
        :disabled="isSignupDisabled"
      >
        가입 완료
      </AppButton>
    </form>

    <AddressSearchLayer
      v-model="isAddressSearchOpen"
      title="우편번호 찾기"
      @select="handleAddressSelect"
    />
  </main>
</template>
