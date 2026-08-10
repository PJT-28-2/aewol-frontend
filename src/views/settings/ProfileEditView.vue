<script setup>
import { computed, reactive, ref } from 'vue'
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue'
import AppButton from '@/components/common/AppButton.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import { formatPhoneNumber } from '@/utils/phone'

const form = reactive({
  name: '김애월',
  phone: '010-1234-5678',
  postalCode: '16856',
  address: '서울특별시 광진구 화양동',
  addressDetail: '세종대점 컴포즈 302호',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
})
const isCurrentPasswordVerified = ref(false)
const isAddressSearchOpen = ref(false)
const passwordError = ref('')
const isVerifyingPassword = ref(false)
import { MOCK_CURRENT_PASSWORD } from '@/mocks/settings'

const newPasswordCategoryCount = computed(() => {
  const categories = [
    /[A-Za-z]/.test(form.newPassword),
    /\d/.test(form.newPassword),
    /[^A-Za-z0-9]/.test(form.newPassword),
  ]

  return categories.filter(Boolean).length
})

const isNewPasswordValid = computed(() => {
  const length = form.newPassword.length
  const categoryCount = newPasswordCategoryCount.value

  return (categoryCount >= 2 && length >= 10) || (categoryCount >= 3 && length >= 8)
})

const handlePhoneInput = (event) => {
  form.phone = formatPhoneNumber(event.target.value)
}

const handleCurrentPasswordInput = () => {
  isCurrentPasswordVerified.value = false
  form.newPassword = ''
  form.newPasswordConfirm = ''
  passwordError.value = ''
}

const handleAddressSelect = ({ zipCode, address }) => {
  form.postalCode = zipCode
  form.address = address
}

const verifyCurrentPassword = async () => {
  isCurrentPasswordVerified.value = false
  form.newPassword = ''
  form.newPasswordConfirm = ''
  passwordError.value = ''

  if (!form.currentPassword) return

  isVerifyingPassword.value = true

  try {
    if (!import.meta.env.DEV) {
      passwordError.value = '비밀번호 확인 API 연동 예정입니다.'
      return
    }

    if (form.currentPassword !== MOCK_CURRENT_PASSWORD) {
      passwordError.value = '현재 비밀번호가 일치하지 않습니다.'
      return
    }

    isCurrentPasswordVerified.value = true
  } catch (error) {
    passwordError.value =
      error.response?.data?.message ?? '현재 비밀번호가 일치하지 않습니다.'
  } finally {
    isVerifyingPassword.value = false
  }
}
</script>

<template>
  <main
    class="min-h-svh w-full bg-(--color-app-bg) px-[22px] pt-[var(--space-4)] pb-7"
  >
    <header>
      <h1
        class="text-(length:--font-2xl) leading-(--line-height-tight) font-(--font-bold) text-(color:--color-navy)"
      >
        프로필 수정
      </h1>
      <p class="mt-[5px] text-(length:--font-md) leading-[1.3] text-(color:--color-slate-muted)">
        계정 정보를 변경해요
      </p>
    </header>

    <form
      class="mt-[26px] flex flex-col"
      @submit.prevent
    >
      <label
        class="mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-name"
      >
        이름
      </label>
      <input
        id="profile-name"
        v-model="form.name"
        class="h-(--control-height-md) cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-slate-muted) outline-none"
        type="text"
        readonly
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-phone"
      >
        전화번호
      </label>
      <input
        id="profile-phone"
        :value="form.phone"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-leaf)"
        type="tel"
        autocomplete="tel"
        required
        @input="handlePhoneInput"
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-postal-code"
      >
        우편번호
      </label>
      <div class="flex gap-(--space-2)">
        <input
          id="profile-postal-code"
          v-model="form.postalCode"
          class="h-(--control-height-md) min-w-0 flex-1 cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none"
          type="text"
          inputmode="numeric"
          placeholder="우편번호를 검색하세요"
          readonly
          required
        >
        <AppButton
          class="!h-(--control-height-md) !w-20 !rounded-(--radius-lg) !px-0 shrink-0 whitespace-nowrap !text-[length:var(--font-xs)] !font-(--font-bold)"
          variant="primary"
          type="button"
          @click="isAddressSearchOpen = true"
        >
          우편번호 찾기
        </AppButton>
      </div>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-address"
      >
        주소
      </label>
      <input
        id="profile-address"
        v-model="form.address"
        class="h-(--control-height-md) cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none"
        type="text"
        autocomplete="address-line1"
        placeholder="우편번호 찾기를 눌러 입력해주세요"
        readonly
        required
      >
      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-address-detail"
      >
        상세주소
      </label>
      <input
        id="profile-address-detail"
        v-model="form.addressDetail"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
        type="text"
        autocomplete="address-line2"
        placeholder="동, 호수 등 상세주소 입력"
        required
      >

      <div
        class="mt-8 flex items-center gap-3 text-[12px] font-(--font-bold) text-(color:--color-slate-muted)"
      >
        <span
          class="h-px flex-1 bg-(--color-border)"
          aria-hidden="true"
        />
        <span>인증 완료 후 새 비밀번호 설정</span>
        <span
          class="h-px flex-1 bg-(--color-border)"
          aria-hidden="true"
        />
      </div>

      <label
        class="mt-[21px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="current-password"
      >
        현재 비밀번호
      </label>
      <div class="flex gap-(--space-2)">
        <PasswordInput
          id="current-password"
          v-model="form.currentPassword"
          wrapper-class="flex-1"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
          autocomplete="current-password"
          placeholder="현재 비밀번호를 입력해주세요"
          @input="handleCurrentPasswordInput"
        />
        <button
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!form.currentPassword || isVerifyingPassword"
          @click="verifyCurrentPassword"
        >
          {{ isVerifyingPassword ? '확인 중' : '확인' }}
        </button>
      </div>
      <p
        v-if="isVerifyingPassword"
        class="mt-1 text-[11px] text-(color:--color-slate-muted)"
      >
        비밀번호 확인 중...
      </p>
      <p
        v-else-if="passwordError"
        class="mt-1 text-[11px] text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ passwordError }}
      </p>
      <p
        v-else-if="isCurrentPasswordVerified"
        class="mt-1 text-[11px] text-(color:--color-olive)"
      >
        현재 비밀번호가 확인되었습니다.
      </p>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="new-password"
      >
        새 비밀번호
      </label>
      <PasswordInput
        id="new-password"
        v-model="form.newPassword"
        input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:cursor-not-allowed disabled:opacity-50"
        autocomplete="new-password"
        placeholder="2가지 조합 10자리 / 3가지 조합 8자리 이상"
        :disabled="!isCurrentPasswordVerified"
      />
      <p
        v-if="form.newPassword && !isNewPasswordValid"
        class="mt-1 text-[11px] text-(color:--color-danger-strong)"
        role="alert"
      >
        영문·숫자·특수문자 중 2가지 조합은 10자리, 3가지 조합은 8자리 이상 입력해주세요.
      </p>
      <p
        v-else-if="form.newPassword && isNewPasswordValid"
        class="mt-1 text-[11px] text-(color:--color-olive)"
      >
        사용 가능한 비밀번호입니다.
      </p>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="new-password-confirm"
      >
        새 비밀번호 확인
      </label>
      <PasswordInput
        id="new-password-confirm"
        v-model="form.newPasswordConfirm"
        input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf) disabled:cursor-not-allowed disabled:opacity-50"
        autocomplete="new-password"
        placeholder="비밀번호를 한번 더 입력해주세요"
        :disabled="!isCurrentPasswordVerified"
      />

      <AppButton
        class="mt-7"
        type="button"
        size="lg"
        block
        disabled
      >
        저장하기 · API 연동 예정
      </AppButton>
    </form>

    <router-link
      class="mt-[17px] block text-center text-[11.5px] text-(color:--color-slate-muted)"
      to="/settings/withdraw"
    >
      회원 탈퇴
    </router-link>

    <AddressSearchLayer
      v-model="isAddressSearchOpen"
      title="우편번호 찾기"
      @select="handleAddressSelect"
    />
  </main>
</template>
