<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue'
import AppButton from '@/components/common/AppButton.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import { formatPhoneNumber } from '@/utils/phone'

const router = useRouter()
const authStore = useAuthStore()

const isKakaoSignup = ref(false)
const isLoading = ref(false)
const isSendingCode = ref(false)
const isVerifyingCode = ref(false)
const isEmailVerified = ref(false)
const isAddressSearchOpen = ref(false)
const errorMessage = ref('')
const verificationErrorMessage = ref('')
const form = reactive({
  name: '',
  phone: '',
  email: '',
  verificationCode: '',
  password: '',
  passwordConfirm: '',
  zipCode: '',
  address: '',
  addressDetail: '',
})
const agreements = reactive({
  terms: false,
  privacy: false,
  marketing: false,
})

const isAllAgreed = computed(
  () => agreements.terms && agreements.privacy && agreements.marketing,
)

const isPasswordValid = computed(() => {
  const value = form.password
  if (!/^[\x21-\x7E]+$/.test(value)) return false

  const categoryCount = [
    /[A-Za-z]/.test(value),
    /\d/.test(value),
    /[!-/:-@[-`{-~]/.test(value),
  ].filter(Boolean).length

  return (
    value.length <= 20 &&
    ((categoryCount >= 3 && value.length >= 8) ||
      (categoryCount >= 2 && value.length >= 10))
  )
})

const isPasswordConfirmed = computed(
  () => form.passwordConfirm === form.password,
)

const isAddressComplete = computed(
  () =>
    Boolean(form.zipCode.trim()) &&
    Boolean(form.address.trim()),
)

const isSignupDisabled = computed(
  () =>
    isLoading.value ||
    !isEmailVerified.value ||
    !agreements.terms ||
    !agreements.privacy ||
    !isAddressComplete.value ||
    (!isKakaoSignup.value &&
      (!isPasswordValid.value || !isPasswordConfirmed.value)),
)

const handleKakaoSignup = () => {
  router.push('/login')
}

const handleEmailInput = () => {
  isEmailVerified.value = false
  form.verificationCode = ''
  errorMessage.value = ''
  verificationErrorMessage.value = ''
}

const sendVerificationCode = async () => {
  errorMessage.value = ''
  verificationErrorMessage.value = ''
  isEmailVerified.value = false
  form.verificationCode = ''
  const requestedEmail = form.email.trim()
  if (!requestedEmail) return
  isSendingCode.value = true
  try {
    await authStore.sendSignupCode(requestedEmail)
  } catch (error) {
    if (requestedEmail === form.email.trim()) {
      errorMessage.value = error.response?.data?.message ?? '인증번호 발송에 실패했습니다.'
    }
  } finally {
    isSendingCode.value = false
  }
}

const verifyCode = async () => {
  errorMessage.value = ''
  verificationErrorMessage.value = ''
  if (!/^\d{6}$/.test(form.verificationCode)) return
  const requestedEmail = form.email.trim()
  const requestedCode = form.verificationCode
  isVerifyingCode.value = true
  try {
    await authStore.verifySignupCode(requestedEmail, requestedCode)
    if (
      requestedEmail === form.email.trim() &&
      requestedCode === form.verificationCode
    ) {
      isEmailVerified.value = true
    }
  } catch (error) {
    if (
      requestedEmail === form.email.trim() &&
      requestedCode === form.verificationCode
    ) {
      isEmailVerified.value = false
      verificationErrorMessage.value =
        error.response?.data?.message ?? '인증번호를 확인해주세요.'
    }
  } finally {
    isVerifyingCode.value = false
  }
}

const handlePhoneInput = (event) => {
  form.phone = formatPhoneNumber(event.target.value)
}

const toggleAllAgreements = () => {
  const nextValue = !isAllAgreed.value
  agreements.terms = nextValue
  agreements.privacy = nextValue
  agreements.marketing = nextValue
}

const handleAddressSelect = ({ zipCode, address }) => {
  form.zipCode = zipCode
  form.address = address
}

const handleSignup = async () => {
  errorMessage.value = ''

  if (!isKakaoSignup.value && !isPasswordValid.value) {
    errorMessage.value =
      '영문, 숫자, 특수문자만 사용해 2가지 조합은 10~20자, 3가지 조합은 8~20자로 입력해 주세요.'
    return
  }

  if (!isKakaoSignup.value && !isPasswordConfirmed.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  if (!isAddressComplete.value) {
    errorMessage.value = '주소를 입력해 주세요.'
    return
  }

  if (!isEmailVerified.value) {
    errorMessage.value = '이메일 인증을 완료해주세요.'
    return
  }

  if (!agreements.terms || !agreements.privacy) {
    errorMessage.value = '필수 약관에 동의해주세요.'
    return
  }

  isLoading.value = true
  try {
    await authStore.signup({
      email: form.email.trim(),
      verificationCode: form.verificationCode,
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, ''),
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail.trim(),
      terms: agreements.terms,
      privacy: agreements.privacy,
      marketing: agreements.marketing,
    })
    await router.push('/signup/complete')
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '회원가입에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main
    class="min-h-svh w-full bg-(--color-app-bg) px-[22px] pt-[calc(var(--header-height)+var(--space-4))] pb-6"
  >
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
      <IconArrowLeft :size="24" />
    </button>

    <header>
      <h1
        class="text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        회원가입
      </h1>
      <p class="mt-[3px] text-(length:--font-md) leading-[1.3] text-(color:--color-slate-dark)">
        반려동물을 위한, 전용 전자지갑을 시작하세요
      </p>
    </header>

    <button
      class="mt-6 flex h-(--control-height-lg) w-full items-center justify-center rounded-(--radius-xl) bg-(--color-kakao) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-kakao-label) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
      type="button"
      @click="handleKakaoSignup"
    >
      카카오로 3초만에 시작하기
    </button>

    <div
      v-if="!isKakaoSignup"
      class="my-[14px] flex items-center gap-3 text-[11.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-muted)"
    >
      <span
        class="h-px flex-1 bg-(--color-border)"
        aria-hidden="true"
      />
      <span>또는 이메일로 가입</span>
      <span
        class="h-px flex-1 bg-(--color-border)"
        aria-hidden="true"
      />
    </div>
    <p
      v-else
      class="my-[14px] text-center text-[11.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-muted)"
    >
      카카오 회원정보로 가입
    </p>

    <form
      class="flex flex-col"
      @submit.prevent="handleSignup"
    >
      <label
        class="mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-name"
      >
        이름
      </label>
      <input
        id="signup-name"
        v-model="form.name"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
        type="text"
        autocomplete="name"
        placeholder="홍길동"
        :readonly="isKakaoSignup"
        required
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-phone"
      >
        전화번호
      </label>
      <input
        id="signup-phone"
        :value="form.phone"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
        type="tel"
        autocomplete="tel"
        inputmode="tel"
        placeholder="010-1234-5678"
        :readonly="isKakaoSignup"
        required
        @input="handlePhoneInput"
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-email"
      >
        이메일
      </label>
      <div class="flex gap-(--space-2)">
        <input
          id="signup-email"
          v-model="form.email"
          class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
          type="email"
          autocomplete="email"
          placeholder="name@aewol.com"
          :readonly="isKakaoSignup"
          required
          @input="handleEmailInput"
        >
        <button
          v-if="!isKakaoSignup"
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy)"
          type="button"
          :disabled="isSendingCode || !form.email.trim()"
          @click="sendVerificationCode"
        >
          {{ isSendingCode ? '발송 중' : '인증하기' }}
        </button>
      </div>

      <template v-if="!isKakaoSignup">
        <label
          class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="signup-code"
        >
          인증번호
        </label>
        <div class="flex gap-(--space-2)">
          <input
            id="signup-code"
            v-model="form.verificationCode"
            class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="6자리 숫자 입력"
            required
            @input="isEmailVerified = false; verificationErrorMessage = ''"
          >
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:opacity-50"
            type="button"
            :disabled="isVerifyingCode || !/^\d{6}$/.test(form.verificationCode)"
            @click="verifyCode"
          >
            {{ isEmailVerified ? '완료' : isVerifyingCode ? '확인 중' : '확인' }}
          </button>
        </div>
        <p
          v-if="isEmailVerified"
          class="mt-1 text-[11px] text-(color:--color-olive)"
          role="status"
        >
          이메일 인증이 완료되었습니다.
        </p>
        <p
          v-else-if="verificationErrorMessage"
          class="mt-1 text-[11px] text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ verificationErrorMessage }}
        </p>

        <label
          class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="signup-password"
        >
          비밀번호
        </label>
        <PasswordInput
          id="signup-password"
          v-model="form.password"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
          autocomplete="new-password"
          placeholder="2가지 조합 10~20자 / 3가지 조합 8~20자"
          maxlength="20"
          required
        />
        <p
          v-if="form.password && !isPasswordValid"
          class="mt-1 text-[11px] text-(color:--color-danger-strong)"
          role="alert"
        >
          영문, 숫자, 특수문자만 사용해 2가지 조합은 10~20자, 3가지 조합은 8~20자로 입력해 주세요.
        </p>
        <p
          v-else-if="form.password && isPasswordValid"
          class="mt-1 text-[11px] text-(color:--color-olive)"
        >
          사용 가능한 비밀번호입니다.
        </p>

        <label
          class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="signup-password-confirm"
        >
          비밀번호 확인
        </label>
        <PasswordInput
          id="signup-password-confirm"
          v-model="form.passwordConfirm"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
          autocomplete="new-password"
          placeholder="비밀번호를 한번 더 입력해주세요"
          maxlength="20"
          required
        />
        <p
          v-if="form.passwordConfirm && !isPasswordConfirmed"
          class="mt-1 text-[11px] text-(color:--color-danger-strong)"
          role="alert"
        >
          비밀번호가 일치하지 않습니다.
        </p>
        <p
          v-else-if="form.passwordConfirm && isPasswordConfirmed"
          class="mt-1 text-[11px] text-(color:--color-olive)"
        >
          비밀번호가 일치합니다.
        </p>
      </template>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-zip-code"
      >
        우편번호
      </label>
      <div class="flex gap-(--space-2)">
        <input
          id="signup-zip-code"
          v-model="form.zipCode"
          class="h-(--control-height-md) min-w-0 flex-1 cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted)"
          type="text"
          inputmode="numeric"
          placeholder="우편번호를 검색하세요"
          readonly
          required
        >

        <button
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[11px] font-(--font-bold) text-(color:--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-leaf-dark)"
          type="button"
          @click="isAddressSearchOpen = true"
        >
          우편번호 찾기
        </button>
      </div>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-address"
      >
        주소
      </label>
      <input
        id="signup-address"
        v-model="form.address"
        class="h-(--control-height-md) cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted)"
        type="text"
        autocomplete="address-line1"
        placeholder="우편번호 찾기를 눌러 입력해주세요"
        readonly
        required
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-address-detail"
      >
        상세주소
      </label>
      <input
        id="signup-address-detail"
        v-model="form.addressDetail"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
        type="text"
        autocomplete="address-line2"
        placeholder="건물, 아파트, 동/호수 입력"
      >

      <fieldset class="mt-8 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-[18px] py-4 shadow-(--shadow-card)">
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
              required
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
              required
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
        v-if="errorMessage"
        class="mt-3 text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        class="mt-6"
        type="submit"
        size="lg"
        block
        :loading="isLoading"
        :disabled="isSignupDisabled"
      >
        가입하기
      </AppButton>
    </form>

    <p class="mt-[13px] text-center text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)">
      이미 계정이 있으신가요?
      <router-link
        class="text-(color:--color-navy)"
        to="/login"
      >
        로그인
      </router-link>
    </p>

    <AddressSearchLayer
      v-model="isAddressSearchOpen"
      title="우편번호 찾기"
      @select="handleAddressSelect"
    />
  </main>
</template>
