<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  KAKAO_ACCOUNT_RESTORED,
  KAKAO_ADDITIONAL_INFO_REQUIRED,
  KAKAO_LOGIN_COMPLETE,
  useAuthStore,
} from '@/stores/auth'
import { usePetStore } from '@/stores/pet'
import AewolLogo from '@/components/common/AewolLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'

const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const petStore = usePetStore()
const errorMessage = ref('')
const isRestoredNoticeVisible = ref(false)
const restoredLoginPath = ref('')
let isRestoredNavigationStarted = false

const resolvePostLoginPath = async () => {
  try {
    const pets = await petStore.fetchPets()
    return pets.length === 0 ? '/share/start' : '/home'
  } catch {
    return '/home'
  }
}

const completeRestoredLogin = async () => {
  if (isRestoredNavigationStarted || !restoredLoginPath.value) return
  isRestoredNavigationStarted = true
  isRestoredNoticeVisible.value = false
  const path = restoredLoginPath.value
  restoredLoginPath.value = ''
  await router.replace(path)
}

const handleRestoredNoticeVisibility = (isVisible) => {
  if (!isVisible) completeRestoredLogin()
}

/**
 * 카카오 OAuth 콜백을 검증하고 애월 로그인을 완료한다.
 * 로그인 화면에서 생성한 state가 일치할 때만 인증 코드를 서버에 전달한다.
 *
 * @returns {Promise<void>}
 */
const handleKakaoCallback = async () => {
  // =========================
  // OAuth state 검증
  // =========================
  const returnedState =
    typeof route.query.state === 'string' ? route.query.state : ''
  const expectedState = window.sessionStorage.getItem(
    KAKAO_OAUTH_STATE_KEY,
  )

  // 로그인 화면에서 시작하지 않은 콜백은 CSRF 요청일 수 있어 API 호출 전에 차단한다.
  // 검증 전에 저장값을 삭제하면 잘못된 콜백 하나로 정상 로그인 시도가 무효화될 수 있다.
  if (
    !expectedState ||
    !returnedState ||
    returnedState !== expectedState
  ) {
    errorMessage.value = '유효하지 않은 로그인 요청입니다. 다시 시도해주세요.'
    return
  }

  // 일치가 확인된 state는 재사용 공격을 막기 위해 즉시 제거한다.
  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY)

  // 사용자가 카카오 동의를 취소한 경우 불필요한 인증 코드 처리를 진행하지 않는다.
  if (route.query.error) {
    errorMessage.value = '카카오 로그인이 취소되었거나 실패했습니다.'
    return
  }

  // =========================
  // 카카오 로그인 API 요청
  // =========================
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code) {
    errorMessage.value = '인증 코드가 없습니다.'
    return
  }

  try {
    // 백엔드가 카카오 인증 코드를 교환하고 애월 토큰을 발급하도록 요청한다.
    const result = await authStore.kakaoLogin(code)

    if (result.authStatus === KAKAO_ADDITIONAL_INFO_REQUIRED) {
      await router.replace('/signup/kakao/additional-info')
      return
    }

    if (
      result.authStatus !== KAKAO_LOGIN_COMPLETE &&
      result.authStatus !== KAKAO_ACCOUNT_RESTORED
    ) {
      throw new Error('카카오 로그인 응답을 확인할 수 없습니다.')
    }

    const postLoginPath = await resolvePostLoginPath()
    if (result.authStatus === KAKAO_ACCOUNT_RESTORED) {
      restoredLoginPath.value = postLoginPath
      isRestoredNoticeVisible.value = true
      return
    }

    await router.replace(postLoginPath)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '카카오 로그인 처리에 실패했습니다.'
  }
}

onMounted(handleKakaoCallback)
</script>

<template>
  <main class="flex min-h-svh items-center justify-center bg-(--color-app-bg) px-(--space-5)">
    <section
      v-if="!errorMessage"
      class="flex flex-col items-center text-center"
    >
      <AewolLogo size="24" />
      <span class="mt-(--space-7) flex size-[76px] items-center justify-center rounded-full bg-(--color-leaf-soft)">
        <LoadingSpinner
          size="lg"
          color="leaf"
        />
      </span>
      <p class="mt-(--space-5) text-(length:--font-md) font-semibold text-(color:--color-navy)">
        카카오 로그인 처리 중...
      </p>
      <p class="mt-(--space-1) text-(length:--font-sm) text-(color:--color-slate-muted)">
        잠시만 기다려주세요
      </p>
    </section>

    <section
      v-else
      class="w-full max-w-[350px] rounded-[24px] border border-(--color-card-border) bg-(--color-white) p-(--space-6) text-center shadow-(--shadow-card)"
    >
      <span class="mx-auto flex size-[64px] items-center justify-center rounded-full bg-(--color-danger-soft) text-(color:--color-danger-strong)">
        <IconWarning size="28" />
      </span>
      <h1 class="mt-(--space-4) text-(length:--font-xl) font-bold text-(color:--color-navy)">
        로그인을 완료하지 못했어요
      </h1>
      <p class="mt-(--space-2) text-(length:--font-sm) leading-[1.55] text-(color:--color-slate-muted)">
        {{ errorMessage }}
      </p>
      <router-link
        to="/login"
        class="mt-(--space-6) flex h-(--control-height-lg) w-full items-center justify-center rounded-(--radius-xl) bg-(--color-leaf) text-(length:--font-base) font-semibold text-(color:--color-navy) no-underline"
      >
        로그인으로 돌아가기
      </router-link>
    </section>
  </main>
  <AppModal
    :model-value="isRestoredNoticeVisible"
    :show-header="false"
    :show-close="false"
    :divider="false"
    @update:model-value="handleRestoredNoticeVisibility"
  >
    <div class="flex flex-col items-center text-center">
      <span class="flex size-(--icon-badge-size) items-center justify-center rounded-(--radius-xl) bg-(--color-leaf-soft) text-(color:--color-navy)">
        <IconCheck size="24" />
      </span>
      <h2 class="mt-(--space-4) text-(length:--font-lg) font-bold text-(color:--color-navy)">
        계정 복구 완료
      </h2>
      <p class="mt-(--space-2) w-full text-(length:--font-md) leading-[1.55] text-(color:--color-slate-dark)">
        탈퇴했던 계정이 복구되었습니다.
      </p>
      <AppButton
        class="mt-(--space-6)"
        type="button"
        size="lg"
        block
        @click="completeRestoredLogin"
      >
        확인
      </AppButton>
    </div>
  </AppModal>
</template>
