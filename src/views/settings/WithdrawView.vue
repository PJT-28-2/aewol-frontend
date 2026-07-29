<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
  import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import withdrawalConfirmImage from '@/assets/images/withdrawal-confirm.png'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const isProcessing = ref(false)
const errorMessage = ref('')
const canWithdraw = computed(
  () => password.value.length > 0 && !isProcessing.value,
)
const PROFILE_VERIFIED_KEY = 'profileEditPasswordVerified'
const WITHDRAWAL_COMPLETED_KEY = 'withdrawalCompleted'
const MOCK_CURRENT_PASSWORD = 'test1234'

const handleCancel = async () => {
  window.sessionStorage.setItem(PROFILE_VERIFIED_KEY, 'true')
  await router.push('/settings/profile')
}

const handleWithdraw = async () => {
  if (!canWithdraw.value) return

  errorMessage.value = ''
  isProcessing.value = true

  try {
    if (!import.meta.env.DEV) {
      errorMessage.value = '회원탈퇴 API 연동 예정입니다.'
      return
    }

    if (password.value !== MOCK_CURRENT_PASSWORD) {
      errorMessage.value = '현재 비밀번호가 일치하지 않습니다.'
      return
    }

    authStore.clearSession()
    window.sessionStorage.setItem(WITHDRAWAL_COMPLETED_KEY, 'true')
    await router.push('/withdraw/complete')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '회원탈퇴 처리에 실패했습니다.'
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <main
    class="mx-auto min-h-svh w-full max-w-[390px] overflow-hidden rounded-[32px] bg-(--color-white) px-[22px] pt-4 pb-8"
  >
    <div
      class="mx-auto h-[5px] w-10 rounded-(--radius-sm) bg-(--color-border)"
      aria-hidden="true"
    />

    <img
      class="mx-auto mt-[45px] size-[139px] object-contain"
      :src="withdrawalConfirmImage"
      alt=""
    >

    <section
      class="mt-[10px] text-center"
      aria-labelledby="withdraw-title"
    >
      <h1
        id="withdraw-title"
        class="text-[18px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        정말 탈퇴하시겠어요?
      </h1>
      <p class="mt-[7px] text-[12.5px] leading-[1.45] text-(color:--color-slate-muted)">
        탈퇴하면 아래 정보가 모두 삭제되며<br>
        복구할 수 없어요
      </p>
    </section>

    <ul
      class="mt-[22px] flex h-[124px] flex-col justify-center gap-[11px] rounded-[14px] bg-(--color-danger-soft) px-4 text-[11.5px] leading-[1.3] text-(color:--color-danger-muted)"
    >
      <li class="flex items-center gap-[9px]">
        <span class="size-[5px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>펫지갑 잔액, 버킷, SOS포켓, 저금통 전체</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[5px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>결제 · 정산 내역 및 반려동물 프로필</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[5px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>가족 공유(공동양육) 연결 정보</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[5px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>연동된 계좌 정보</span>
      </li>
    </ul>

    <form
      class="mt-[13px]"
      @submit.prevent="handleWithdraw"
    >
      <label
        class="mb-[6px] block text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
        for="withdraw-password"
      >
        본인 확인을 위해 비밀번호를 입력해주세요
      </label>
      <input
        id="withdraw-password"
        v-model="password"
        class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
        type="password"
        autocomplete="current-password"
        placeholder="비밀번호 입력"
        required
      >
      <p
        v-if="errorMessage"
        class="mt-2 text-[12px] text-(color:--color-danger)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="mt-[14px] grid grid-cols-2 gap-3">
        <button
          class="h-(--control-height-lg) rounded-(--radius-xl) border border-(--color-border) bg-(--color-white) text-[14.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          type="button"
          :disabled="isProcessing"
          @click="handleCancel"
        >
          취소
        </button>
        <button
          class="h-(--control-height-lg) rounded-(--radius-xl) bg-(--color-danger-strong) text-[14.5px] font-(--font-bold) text-(color:--color-white) disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          :disabled="!canWithdraw"
        >
          {{ isProcessing ? '처리 중...' : '탈퇴하기' }}
        </button>
      </div>
    </form>
  </main>
</template>
