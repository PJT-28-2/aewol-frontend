<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

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
const passwordError = ref('')
const isVerifyingPassword = ref(false)
const isSaving = ref(false)

const canSave = computed(() => {
  const hasNewPassword =
    form.newPassword.length > 0 || form.newPasswordConfirm.length > 0

  if (!hasNewPassword) return true

  return (
    isCurrentPasswordVerified.value &&
    form.newPassword.length >= 8 &&
    form.newPassword === form.newPasswordConfirm
  )
})

const handleCurrentPasswordInput = () => {
  isCurrentPasswordVerified.value = false
  form.newPassword = ''
  form.newPasswordConfirm = ''
  passwordError.value = ''
}

const verifyCurrentPassword = async () => {
  isCurrentPasswordVerified.value = false
  form.newPassword = ''
  form.newPasswordConfirm = ''
  passwordError.value = ''

  if (!form.currentPassword) return

  isVerifyingPassword.value = true

  try {
    if (import.meta.env.DEV) {
      if (form.currentPassword !== 'test1234') {
        passwordError.value = '현재 비밀번호가 일치하지 않습니다.'
        return
      }
    } else {
      const email = authStore.user?.email
      if (!email) {
        passwordError.value = '현재 계정 정보를 확인할 수 없습니다.'
        return
      }
      await authStore.login(email, form.currentPassword)
    }

    isCurrentPasswordVerified.value = true
  } catch (error) {
    passwordError.value =
      error.response?.data?.message ?? '현재 비밀번호가 일치하지 않습니다.'
  } finally {
    isVerifyingPassword.value = false
  }
}

const handleSave = async () => {
  passwordError.value = ''

  if (form.newPassword && form.newPassword.length < 8) {
    passwordError.value = '새 비밀번호는 8자 이상 입력해주세요.'
    return
  }

  if (form.newPassword !== form.newPasswordConfirm) {
    passwordError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }

  isSaving.value = true
  try {
    await router.push('/settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main
    class="mx-auto min-h-svh w-full max-w-[390px] bg-(--color-white) px-[22px] pt-[61px] pb-7"
  >
    <header>
      <h1 class="text-[20px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)">
        프로필 수정
      </h1>
      <p class="mt-[5px] text-[12.5px] leading-[1.3] text-(color:--color-slate-muted)">
        계정 정보를 변경해요
      </p>
    </header>

    <form
      class="mt-[26px] flex flex-col"
      @submit.prevent="handleSave"
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
        v-model="form.phone"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
        type="tel"
        autocomplete="tel"
        required
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-postal-code"
      >
        주소
      </label>
      <div class="flex gap-(--space-4)">
        <input
          id="profile-postal-code"
          v-model="form.postalCode"
          class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
          type="text"
          inputmode="numeric"
          required
        >
        <button
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[12px] font-(--font-bold) text-(color:--color-white)"
          type="button"
        >
          주소 찾기
        </button>
      </div>
      <label
        class="sr-only"
        for="profile-address"
      >주소</label>
      <input
        id="profile-address"
        v-model="form.address"
        class="mt-[13px] h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
        type="text"
        required
      >
      <label
        class="sr-only"
        for="profile-address-detail"
      >상세주소</label>
      <input
        id="profile-address-detail"
        v-model="form.addressDetail"
        class="mt-[13px] h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
        type="text"
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
      <div class="flex gap-(--space-4)">
        <input
          id="current-password"
          v-model="form.currentPassword"
          class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="password"
          autocomplete="current-password"
          placeholder="현재 비밀번호를 입력해주세요"
          @input="handleCurrentPasswordInput"
        >
        <button
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-navy) text-[12.5px] font-(--font-bold) text-(color:--color-white) disabled:cursor-not-allowed disabled:opacity-50"
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
        class="mt-1 text-[11px] text-(color:--color-danger)"
        role="alert"
      >
        {{ passwordError }}
      </p>
      <p
        v-else-if="isCurrentPasswordVerified"
        class="mt-1 text-[11px] text-(color:--color-success)"
      >
        현재 비밀번호가 확인되었습니다.
      </p>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="new-password"
      >
        새 비밀번호
      </label>
      <input
        id="new-password"
        v-model="form.newPassword"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) disabled:cursor-not-allowed disabled:opacity-50"
        type="password"
        autocomplete="new-password"
        placeholder="2가지 조합 10자리 / 3가지 조합 8자리 이상"
        :disabled="!isCurrentPasswordVerified"
      >

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="new-password-confirm"
      >
        새 비밀번호 확인
      </label>
      <input
        id="new-password-confirm"
        v-model="form.newPasswordConfirm"
        class="h-(--control-height-md) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) disabled:cursor-not-allowed disabled:opacity-50"
        type="password"
        autocomplete="new-password"
        placeholder="비밀번호를 한번 더 입력해주세요"
        :disabled="!isCurrentPasswordVerified"
      >

      <AppButton
        class="mt-7"
        type="submit"
        size="lg"
        block
        :disabled="!canSave"
        :loading="isSaving"
      >
        저장하기
      </AppButton>
    </form>

    <router-link
      class="mt-[17px] block text-center text-[11.5px] text-(color:--color-slate-muted)"
      to="/settings/withdraw"
    >
      회원 탈퇴
    </router-link>
  </main>
</template>
