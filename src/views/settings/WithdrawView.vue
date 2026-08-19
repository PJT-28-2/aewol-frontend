<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'
import PasswordInput from '@/components/common/PasswordInput.vue'
import StatusVisual from '@/components/common/StatusVisual.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const memberStore = useMemberStore()

const password = ref('')
const isProcessing = ref(false)
const errorMessage = ref('')
const canWithdraw = computed(
  () =>
    !isProcessing.value &&
    (memberStore.profile?.provider === 'KAKAO' || password.value.length > 0),
)
const WITHDRAWAL_COMPLETED_KEY = 'withdrawalCompleted'
const isLocalProvider = computed(() => memberStore.profile?.provider === 'LOCAL')

onMounted(async () => {
  if (!memberStore.profile) await memberStore.fetchProfile()
})

const handleCancel = async () => {
  await router.push('/settings')
}

const handleWithdraw = async () => {
  if (!canWithdraw.value) return

  errorMessage.value = ''
  isProcessing.value = true

  try {
    await memberStore.withdraw(isLocalProvider.value ? password.value : undefined)
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
  <main class="mx-auto min-h-screen w-full max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-5) pt-(--space-5) pb-[calc(var(--bottom-nav-height)+var(--space-8))]">
    <StatusVisual
      variant="danger"
      size="96"
      class="mx-auto mt-(--space-4)"
    />

    <section
      class="mt-(--space-4) text-center"
      aria-labelledby="withdraw-title"
    >
      <h1
        id="withdraw-title"
        class="text-(length:--font-2xl) leading-[1.3] font-bold text-(color:--color-navy)"
      >
        정말 탈퇴하시겠어요?
      </h1>
      <p class="mt-[7px] text-(length:--font-md) leading-[1.45] text-(color:--color-slate-muted)">
        탈퇴하면 아래 정보가 모두 삭제되며<br>
        복구할 수 없어요
      </p>
    </section>

    <ul
      class="mt-(--space-6) flex flex-col gap-(--space-3) rounded-[20px] border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-(length:--font-sm) leading-[1.45] text-(color:--color-slate-dark)"
    >
      <li class="flex items-center gap-[9px]">
        <span class="size-[6px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>애월지갑 잔액, SOS포켓, 저금통 전체</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[6px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>결제 · 정산 내역 및 반려동물 프로필</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[6px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>가족 공유(공동육아) 연결 정보</span>
      </li>
      <li class="flex items-center gap-[9px]">
        <span class="size-[6px] shrink-0 rounded-full bg-(--color-danger-strong)" />
        <span>연동된 계좌 정보</span>
      </li>
    </ul>

    <form
      class="mt-(--space-5)"
      @submit.prevent="handleWithdraw"
    >
      <label
        v-if="isLocalProvider"
        class="mb-(--space-2) block text-(length:--font-sm) font-bold text-(color:--color-slate-dark)"
        for="withdraw-password"
      >
        본인 확인을 위해 비밀번호를 입력해주세요
      </label>
      <PasswordInput
        v-if="isLocalProvider"
        id="withdraw-password"
        v-model="password"
        input-class="h-(--control-height-md) w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) px-(--space-4) text-(length:--font-md) text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf-dark)"
        autocomplete="current-password"
        placeholder="비밀번호 입력"
        required
      />
      <p
        v-if="errorMessage"
        class="mt-2 text-[12px] text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="mt-(--space-5) grid grid-cols-2 gap-(--space-3)">
        <AppButton
          variant="secondary"
          size="lg"
          type="button"
          :disabled="isProcessing"
          @click="handleCancel"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          size="lg"
          type="submit"
          :disabled="!canWithdraw"
          :loading="isProcessing"
        >
          탈퇴하기
        </AppButton>
      </div>
    </form>
  </main>
</template>
