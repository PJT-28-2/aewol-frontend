<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue'
import AppButton from '@/components/common/AppButton.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'

const router = useRouter()

const isKakaoSignup = ref(false)
const isLoading = ref(false)
const isAddressSearchOpen = ref(false)
const errorMessage = ref('')
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

const passwordCategoryCount = computed(() => {
  const categories = [
    /[A-Za-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ]

  return categories.filter(Boolean).length
})

const isPasswordValid = computed(() => {
  const length = form.password.length
  const categoryCount = passwordCategoryCount.value

  return (categoryCount >= 2 && length >= 10) || (categoryCount >= 3 && length >= 8)
})

const isPasswordConfirmed = computed(
  () => form.passwordConfirm === form.password,
)

const handleKakaoSignup = () => {
  isKakaoSignup.value = true
  form.name = '홍길동'
  form.phone = '010-1234-5678'
  form.email = 'kakao@example.com'
  form.verificationCode = ''
  form.password = ''
  form.passwordConfirm = ''
  errorMessage.value = ''
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
  await router.push('/login')
}
</script>

<template>
  <main
    class="mx-auto min-h-svh w-[min(100%,390px)] overflow-hidden bg-(--color-white) px-[22px] pt-[58px] pb-6 min-[391px]:my-6 min-[391px]:rounded-[40px] min-[391px]:shadow-(--shadow-lg)"
  >
    <button
      class="flex size-6 items-center justify-center text-(color:--color-navy)"
      type="button"
      aria-label="이전 화면으로 돌아가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="24" />
    </button>

    <header class="mt-[25px]">
      <h1
        class="text-[22px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        회원가입
      </h1>
      <p class="mt-[3px] text-[12.5px] leading-[1.3] text-(color:--color-slate-dark)">
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
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
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
        v-model="form.phone"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
        type="tel"
        autocomplete="tel"
        inputmode="tel"
        placeholder="010-1234-5678"
        :readonly="isKakaoSignup"
        required
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="signup-email"
      >
        이메일
      </label>
      <div class="flex gap-(--space-4)">
        <input
          id="signup-email"
          v-model="form.email"
          class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) read-only:cursor-default read-only:text-(color:--color-slate-muted)"
          type="email"
          autocomplete="email"
          placeholder="name@aewol.com"
          :readonly="isKakaoSignup"
          required
        >
        <button
          v-if="!isKakaoSignup"
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[12.5px] font-(--font-bold) text-(color:--color-white)"
          type="button"
        >
          인증
        </button>
      </div>

      <template v-if="!isKakaoSignup">
        <label
          class="mt-[27px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="signup-code"
        >
          인증번호
        </label>
        <input
          id="signup-code"
          v-model="form.verificationCode"
          class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="6자리 숫자 입력"
          required
        >

        <label
          class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="signup-password"
        >
          비밀번호
        </label>
        <PasswordInput
          id="signup-password"
          v-model="form.password"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          autocomplete="new-password"
          placeholder="2가지 조합 10자리 / 3가지 조합 8자리 이상"
          required
        />
        <p
          v-if="form.password && !isPasswordValid"
          class="mt-1 text-[11px] text-(color:--color-danger)"
          role="alert"
        >
          영문·숫자·특수문자 중 2가지 조합은 10자리, 3가지 조합은 8자리 이상 입력해 주세요.
        </p>
        <p
          v-else-if="form.password && isPasswordValid"
          class="mt-1 text-[11px] text-(color:--color-success)"
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
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          autocomplete="new-password"
          placeholder="비밀번호를 한번 더 입력해주세요"
          required
        />
        <p
          v-if="form.passwordConfirm && !isPasswordConfirmed"
          class="mt-1 text-[11px] text-(color:--color-danger)"
          role="alert"
        >
          비밀번호가 일치하지 않습니다.
        </p>
        <p
          v-else-if="form.passwordConfirm && isPasswordConfirmed"
          class="mt-1 text-[11px] text-(color:--color-success)"
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
      <div class="flex gap-(--space-4)">
        <input
          id="signup-zip-code"
          v-model="form.zipCode"
          class="h-(--control-height-md) min-w-0 flex-1 cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted)"
          type="text"
          inputmode="numeric"
          placeholder="12345"
          readonly
          required
        >

        <button
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[11px] font-(--font-bold) text-(color:--color-white) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
          type="button"
          @click="isAddressSearchOpen = true"
        >
          주소 찾기
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
        placeholder="주소"
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
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
        type="text"
        autocomplete="address-line2"
        placeholder="동, 호수 등 상세주소 입력"
        required
      >

      <fieldset class="mt-10 rounded-(--radius-xl) bg-(--color-surface) px-[18px] py-4">
        <legend class="sr-only">
          약관 동의
        </legend>
        <div class="flex items-center justify-between">
          <span class="text-[13px] font-(--font-bold) text-(color:--color-navy)">전체 동의</span>
          <input
            class="size-[18px] accent-(--color-navy)"
            type="checkbox"
            :checked="isAllAgreed"
            aria-label="모든 약관에 동의"
            @change="toggleAllAgreements"
          >
        </div>
        <label class="mt-3 flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <input
            v-model="agreements.terms"
            class="size-4 accent-(--color-navy)"
            type="checkbox"
            required
          >
          <span>(필수) 이용약관 동의</span>
        </label>
        <label class="mt-[10px] flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <input
            v-model="agreements.privacy"
            class="size-4 accent-(--color-navy)"
            type="checkbox"
            required
          >
          <span>(필수) 개인정보 처리방침 동의</span>
        </label>
        <label class="mt-[10px] flex items-center gap-[10px] text-[11.5px] text-(color:--color-slate-dark)">
          <input
            v-model="agreements.marketing"
            class="size-4 accent-(--color-navy)"
            type="checkbox"
          >
          <span>(선택) 마케팅 정보 수신 동의</span>
        </label>
      </fieldset>

      <p
        v-if="errorMessage"
        class="mt-3 text-center text-(length:--font-sm) text-(color:--color-danger)"
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
      @select="handleAddressSelect"
    />
  </main>
</template>
