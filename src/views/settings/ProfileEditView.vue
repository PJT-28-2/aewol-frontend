<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue'
import AppButton from '@/components/common/AppButton.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import { formatPhoneNumber } from '@/utils/phone'
import { isValidPassword } from '@/utils/password'

const memberStore = useMemberStore()
const authStore = useAuthStore()
const router = useRouter()
const form = reactive({
  name: '',
  phone: '',
  profileImg: null,
  zipCode: '',
  address: '',
  addressDetail: '',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
})
const isCurrentPasswordVerified = ref(false)
const isAddressSearchOpen = ref(false)
const isPhoneInputOverflow = ref(false)
const originalPhoneDigits = ref('')
const verificationCode = ref('')
const isCodeSent = ref(false)
const isPhoneVerified = ref(false)
const isSendingCode = ref(false)
const isVerifyingCode = ref(false)
const phoneMessage = ref({ type: 'error', text: '' })
const codeMessage = ref('')
const passwordError = ref('')
const isVerifyingPassword = ref(false)
const isSaving = ref(false)
const isChangingPassword = ref(false)
const saveError = ref('')
const isSaveSuccessVisible = ref(false)
const isLocalProvider = computed(() => memberStore.profile?.provider === 'LOCAL')
let saveSuccessTimer = null

const isNewPasswordValid = computed(() => isValidPassword(form.newPassword))
const phoneDigits = computed(() => form.phone.replace(/\D/g, ''))
const isPhoneValid = computed(
  () => !isPhoneInputOverflow.value && /^010\d{8}$/.test(phoneDigits.value),
)
const isPhoneChanged = computed(
  () => phoneDigits.value !== originalPhoneDigits.value,
)
const canSaveProfile = computed(() => {
  if (!isPhoneValid.value) return false
  if (isPhoneChanged.value && !isPhoneVerified.value) return false
  return true
})

const handlePhoneInput = (event) => {
  const rawPhoneDigits = event.target.value.replace(/\D/g, '')
  isPhoneInputOverflow.value = rawPhoneDigits.length > 11
  form.phone = formatPhoneNumber(event.target.value)
  event.target.value = form.phone
  saveError.value = ''
  verificationCode.value = ''
  isCodeSent.value = false
  isPhoneVerified.value = false
  phoneMessage.value = { type: 'error', text: '' }
  codeMessage.value = ''
}

const getSmsErrorMessage = (error, action) => {
  const status = error.response?.status
  const serverMessage = error.response?.data?.message
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage
  }
  if (status === 429) {
    return '인증번호 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'
  }
  return action === 'send'
    ? '인증번호 전송에 실패했습니다.'
    : '인증번호 확인에 실패했습니다.'
}

const handleRequestPhoneCode = async () => {
  if (!isPhoneValid.value || isSendingCode.value || isPhoneVerified.value) return
  const requestedPhone = phoneDigits.value
  phoneMessage.value = { type: 'error', text: '' }
  codeMessage.value = ''
  isSendingCode.value = true
  try {
    const { data } = await memberStore.sendPhoneVerificationCode(requestedPhone)
    if (phoneDigits.value !== requestedPhone) return
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
    phoneMessage.value = {
      type: 'success',
      text: '인증번호를 전송했습니다.',
    }
  } catch (error) {
    if (phoneDigits.value !== requestedPhone) return
    phoneMessage.value = {
      type: 'error',
      text: getSmsErrorMessage(error, 'send'),
    }
  } finally {
    isSendingCode.value = false
  }
}

const handleVerifyPhoneCode = async () => {
  if (!isCodeSent.value || isVerifyingCode.value || isPhoneVerified.value) return
  if (!/^\d{6}$/.test(verificationCode.value)) {
    codeMessage.value = '인증번호 6자리를 입력해주세요.'
    return
  }
  const requestedPhone = phoneDigits.value
  codeMessage.value = ''
  isVerifyingCode.value = true
  try {
    await memberStore.verifyPhoneCode(requestedPhone, verificationCode.value)
    if (phoneDigits.value !== requestedPhone) return
    isPhoneVerified.value = true
    codeMessage.value = '전화번호 인증이 완료되었습니다.'
  } catch (error) {
    if (phoneDigits.value !== requestedPhone) return
    isPhoneVerified.value = false
    codeMessage.value = getSmsErrorMessage(error, 'verify')
  } finally {
    isVerifyingCode.value = false
  }
}

const handleCurrentPasswordInput = () => {
  isCurrentPasswordVerified.value = false
  form.newPassword = ''
  form.newPasswordConfirm = ''
  passwordError.value = ''
}

const handleAddressSelect = ({ zipCode, address }) => {
  form.zipCode = zipCode
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
    await memberStore.verifyPassword(form.currentPassword)
    isCurrentPasswordVerified.value = true
  } catch (error) {
    passwordError.value =
      error.response?.data?.message ?? '현재 비밀번호가 일치하지 않습니다.'
  } finally {
    isVerifyingPassword.value = false
  }
}

const handleProfileSave = async () => {
  saveError.value = ''
  isSaveSuccessVisible.value = false
  window.clearTimeout(saveSuccessTimer)
  if (!isPhoneValid.value) {
    saveError.value = '010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.'
    return
  }
  if (isPhoneChanged.value && !isPhoneVerified.value) {
    saveError.value = '변경한 전화번호 인증을 완료해 주세요.'
    return
  }
  if (!form.zipCode.trim() || !form.address.trim()) {
    saveError.value = '전화번호와 주소를 확인해주세요.'
    return
  }
  isSaving.value = true
  try {
    await memberStore.updateProfile({
      phone: phoneDigits.value,
      profileImg: form.profileImg,
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail.trim(),
    })
    originalPhoneDigits.value = phoneDigits.value
    isCodeSent.value = false
    isPhoneVerified.value = false
    verificationCode.value = ''
    phoneMessage.value = { type: 'error', text: '' }
    isSaveSuccessVisible.value = true
    saveSuccessTimer = window.setTimeout(() => {
      isSaveSuccessVisible.value = false
    }, 2500)
  } catch (error) {
    saveError.value = error.response?.data?.message ?? '프로필 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

const handlePasswordChange = async () => {
  passwordError.value = ''
  if (!form.currentPassword) {
    passwordError.value = '현재 비밀번호를 입력해주세요.'
    return
  }
  if (!form.newPassword) {
    passwordError.value = '새 비밀번호를 입력해주세요.'
    return
  }
  if (!isCurrentPasswordVerified.value || !isNewPasswordValid.value) {
    passwordError.value = '비밀번호 변경 정보를 확인해주세요.'
    return
  }
  if (form.newPassword !== form.newPasswordConfirm) {
    passwordError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  if (form.currentPassword === form.newPassword) {
    passwordError.value = '새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.'
    return
  }

  isChangingPassword.value = true
  try {
    await memberStore.changePassword(form.currentPassword, form.newPassword)
    authStore.clearSession()
    await router.replace({ path: '/login', query: { reason: 'password-changed' } })
  } catch (error) {
    passwordError.value = error.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(async () => {
  const profile = memberStore.profile ?? await memberStore.fetchProfile()
  form.name = profile.name ?? ''
  form.phone = formatPhoneNumber(profile.phone ?? '')
  originalPhoneDigits.value = (profile.phone ?? '').replace(/\D/g, '')
  form.profileImg = profile.profileImg ?? null
  form.zipCode = profile.zipCode ?? ''
  form.address = profile.address ?? ''
  form.addressDetail = profile.addressDetail ?? ''
})

onBeforeUnmount(() => window.clearTimeout(saveSuccessTimer))
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
    </header>

    <form
      class="mt-[26px] flex flex-col"
      @submit.prevent="handleProfileSave"
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
      <div class="flex gap-(--space-2)">
        <input
          id="profile-phone"
          :value="form.phone"
          class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-leaf)"
          type="tel"
          autocomplete="tel"
          inputmode="tel"
          required
          @input="handlePhoneInput"
        >
        <button
          v-if="isPhoneChanged"
          class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!isPhoneValid || isSendingCode || isVerifyingCode || isPhoneVerified"
          @click="handleRequestPhoneCode"
        >
          {{ isCodeSent ? '다시 받기' : '인증번호 받기' }}
        </button>
      </div>
      <p
        v-if="form.phone && !isPhoneValid"
        class="mt-1 text-[11px] text-(color:--color-danger-strong)"
        role="alert"
      >
        010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.
      </p>
      <p
        v-else-if="phoneMessage.text"
        class="mt-1 text-[11px]"
        :class="phoneMessage.type === 'success' ? 'text-(color:--color-olive)' : 'text-(color:--color-danger-strong)'"
        :role="phoneMessage.type === 'success' ? 'status' : 'alert'"
      >
        {{ phoneMessage.text }}
      </p>

      <template v-if="isPhoneChanged && isCodeSent">
        <label
          class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="profile-phone-code"
        >
          인증번호
        </label>
        <div class="flex gap-(--space-2)">
          <input
            id="profile-phone-code"
            v-model="verificationCode"
            class="h-(--control-height-md) min-w-0 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-leaf) disabled:cursor-not-allowed disabled:opacity-50"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="6자리 숫자 입력"
            :disabled="isPhoneVerified"
            @input="verificationCode = verificationCode.replace(/\D/g, '').slice(0, 6)"
          >
          <button
            class="h-(--control-height-md) w-20 shrink-0 rounded-(--radius-lg) bg-(--color-leaf) text-[12.5px] font-(--font-bold) text-(color:--color-navy) disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isPhoneVerified || isVerifyingCode || verificationCode.length !== 6"
            @click="handleVerifyPhoneCode"
          >
            {{ isPhoneVerified ? '인증 완료' : '확인' }}
          </button>
        </div>
        <p
          v-if="codeMessage"
          class="mt-1 text-[11px]"
          :class="isPhoneVerified ? 'text-(color:--color-olive)' : 'text-(color:--color-danger-strong)'"
          :role="isPhoneVerified ? 'status' : 'alert'"
        >
          {{ codeMessage }}
        </p>
      </template>

      <label
        class="mt-[11px] mb-1 text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="profile-postal-code"
      >
        우편번호
      </label>
      <div class="flex gap-(--space-2)">
        <input
          id="profile-postal-code"
          v-model="form.zipCode"
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

      <p
        v-if="saveError"
        class="mt-3 text-[12px] text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ saveError }}
      </p>

      <AppButton
        class="mt-7"
        type="submit"
        size="lg"
        block
        :loading="isSaving"
        :disabled="isSaving || !canSaveProfile"
      >
        저장하기
      </AppButton>
    </form>

    <form
      v-if="isLocalProvider"
      class="flex flex-col"
      @submit.prevent="handlePasswordChange"
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
        placeholder="2가지 조합 10~20자 / 3가지 조합 8~20자"
        maxlength="20"
        :disabled="!isCurrentPasswordVerified"
      />
      <p
        v-if="form.newPassword && !isNewPasswordValid"
        class="mt-1 text-[11px] text-(color:--color-danger-strong)"
        role="alert"
      >
        영문, 숫자, 특수문자만 사용해 2가지 조합은 10~20자, 3가지 조합은 8~20자로 입력해주세요.
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
        maxlength="20"
        :disabled="!isCurrentPasswordVerified"
      />
      <p
        v-if="passwordError"
        class="mt-3 text-[12px] text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ passwordError }}
      </p>

      <AppButton
        class="mt-7"
        type="submit"
        size="lg"
        block
        :loading="isChangingPassword"
        :disabled="isChangingPassword"
      >
        비밀번호 변경하기
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

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="isSaveSuccessVisible"
          role="status"
          aria-live="polite"
          class="fixed top-7 left-1/2 z-[1100] -translate-x-1/2 rounded-(--radius-icon) border border-(--color-border) bg-(--color-white) px-4 py-3 text-[12.5px] font-(--font-bold) text-(color:--color-navy) shadow-(--shadow-lg)"
        >
          프로필이 저장되었습니다.
        </div>
      </Transition>
    </Teleport>
  </main>
</template>
