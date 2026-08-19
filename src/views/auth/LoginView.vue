<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePetStore } from '@/stores/pet'
import PasswordInput from '@/components/common/PasswordInput.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import { startKakaoOAuth } from '@/utils/kakaoOAuth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const petStore = usePetStore()

/**
 * 로그인 직후 이동할 화면을 정한다.
 * 등록된 반려동물이 없으면 반려동물 등록/가족 참여를 먼저 안내하는 시작 화면으로 보낸다.
 *
 * @returns {Promise<string>}
 */
const resolvePostLoginPath = async () => {
  try {
    const pets = await petStore.fetchPets()
    return pets.length === 0 ? '/share/start' : '/home'
  } catch {
    return '/home'
  }
}

const showEmailForm = ref(false)
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const passwordChangeNotice = computed(() =>
  route.query.reason === 'password-changed'
    ? '비밀번호가 변경되었습니다. 다시 로그인해주세요.'
    : '',
)
let loginAttemptId = 0

/**
 * 이메일 로그인 화면을 연다.
 * 이전 로그인 방식에서 남은 오류가 폼에 노출되지 않도록 함께 초기화한다.
 *
 * @returns {void}
 */
const openEmailLogin = () => {
  errorMessage.value = ''
  showEmailForm.value = true
}

/**
 * 이메일 로그인 화면을 닫고 민감한 입력 상태를 제거한다.
 * 진행 중인 요청의 지연 응답이 시작 화면을 오염시키지 않도록 요청 식별값도 갱신한다.
 *
 * @returns {void}
 */
const closeEmailLogin = () => {
  loginAttemptId += 1
  showEmailForm.value = false
  email.value = ''
  password.value = ''
  errorMessage.value = ''
  isLoading.value = false
}

/**
 * 이메일과 비밀번호로 로그인을 요청한다.
 * 사용자가 요청 도중 화면을 닫은 경우 해당 응답은 더 이상 유효하지 않으므로 무시한다.
 *
 * @returns {Promise<void>}
 */
const handleEmailLogin = async () => {
  // =========================
  // 요청 상태 초기화
  // =========================
  const currentAttemptId = ++loginAttemptId
  errorMessage.value = ''
  isLoading.value = true

  try {
    // =========================
    // 로그인 API 요청
    // =========================
    // 서버 인증 성공 후 토큰을 저장하기 위해 Pinia 인증 액션을 호출한다.
    await authStore.login(email.value, password.value)

    // 뒤로가기로 무효화된 요청은 성공하더라도 화면을 이동시키지 않는다.
    if (currentAttemptId !== loginAttemptId) return
    const postLoginPath = await resolvePostLoginPath()
    if (currentAttemptId !== loginAttemptId) return
    await router.push(postLoginPath)
  } catch (error) {
    // 뒤로간 뒤 도착한 오류가 로그인 선택 화면에 노출되는 것을 방지한다.
    if (currentAttemptId !== loginAttemptId) return
    errorMessage.value =
      error.response?.data?.message ?? '이메일 또는 비밀번호를 확인해 주세요.'
  } finally {
    if (currentAttemptId === loginAttemptId) {
      isLoading.value = false
    }
  }
}

/**
 * 카카오 OAuth 인증 화면으로 이동한다.
 * 콜백 위조를 막기 위해 요청마다 state를 생성하고 현재 탭의 세션에 보관한다.
 *
 * @returns {void}
 */
const handleKakaoLogin = () => {
  if (!startKakaoOAuth()) {
    errorMessage.value = '카카오 로그인 설정을 확인해 주세요.'
  }
}
</script>

<template>
  <main
    class="min-h-svh w-full bg-(--color-app-bg)"
  >
    <template v-if="!showEmailForm">
      <section
        class="relative h-[480px] bg-(--color-leaf-soft) max-h-[700px]:h-[420px]"
        aria-labelledby="login-title"
      >
        <h1
          id="login-title"
          class="sr-only"
        >
          애월 로그인
        </h1>

        <AewolLogo
          class="absolute top-[190px] left-1/2 -translate-x-1/2 max-h-[700px]:top-[155px]"
          size="38"
        />
        <p
          class="absolute top-[250px] w-full text-center text-(length:--auth-font-sm) leading-[1.3] text-(color:--color-slate-dark) max-h-[700px]:top-[214px]"
        >
          반려동물을 위한, 전자 지갑
        </p>
      </section>

      <section
        class="relative flex flex-col gap-[14px] px-[26px] pt-[60px] pb-8 max-h-[700px]:pt-9"
        aria-label="로그인 메뉴"
      >
        <p
          v-if="passwordChangeNotice"
          class="text-center text-(length:--font-sm) text-(color:--color-olive)"
          role="status"
        >
          {{ passwordChangeNotice }}
        </p>
        <button
          class="flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-(--color-kakao) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-kakao-label)"
          type="button"
          @click="handleKakaoLogin"
        >
          카카오로 3초만에 시작하기
        </button>
        <button
          class="flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-(--color-leaf) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
          type="button"
          @click="openEmailLogin"
        >
          이메일로 로그인
        </button>

        <nav
          class="mt-[9px] flex justify-center gap-[7px] text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          aria-label="회원 메뉴"
        >
          <router-link to="/signup">
            회원가입
          </router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/id/find">
            계정 찾기
          </router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/password/reset">
            비밀번호 찾기
          </router-link>
        </nav>
        <p
          v-if="errorMessage"
          class="text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </section>
    </template>

    <section
      v-else
      class="relative min-h-[700px] px-[22px] pt-[calc(var(--header-height)+var(--space-4))] pb-8"
      aria-labelledby="email-login-title"
    >
      <div
        class="fixed inset-x-0 top-0 z-100 h-(--header-height) bg-(--color-app-bg)"
        aria-hidden="true"
      />
      <button
        class="fixed top-(--space-2) left-(--space-4) z-101 flex size-10 items-center justify-center text-(color:--color-navy)"
        type="button"
        aria-label="이전 화면으로 돌아가기"
        @click="closeEmailLogin"
      >
        <IconArrowLeft size="24" />
      </button>

      <h2
        id="email-login-title"
        class="text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        이메일로 로그인
      </h2>
      <p class="mt-[3px] text-(length:--font-md) leading-[1.3] text-(color:--color-slate-muted)">
        계정 정보를 입력해주세요
      </p>
      <p
        v-if="passwordChangeNotice"
        class="mt-3 text-(length:--font-sm) text-(color:--color-olive)"
        role="status"
      >
        {{ passwordChangeNotice }}
      </p>

      <form
        class="mt-9 flex flex-col"
        @submit.prevent="handleEmailLogin"
      >
        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="email"
        >
          이메일
        </label>
        <input
          id="email"
          v-model="email"
          class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
          type="email"
          autocomplete="email"
          placeholder="example@aewol.com"
          required
        >
        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="password"
        >
          비밀번호
        </label>
        <PasswordInput
          id="password"
          v-model="password"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
          autocomplete="current-password"
          placeholder="8자 이상 입력해주세요"
          minlength="8"
          required
        />
        <button
          class="mt-6 flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-(--color-leaf) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy) disabled:cursor-wait disabled:opacity-65"
          type="submit"
          :disabled="isLoading"
        >
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <nav
        class="mt-[15px] flex justify-center gap-[7px] text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
        aria-label="회원 메뉴"
      >
        <router-link to="/signup">
          회원가입
        </router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/id/find">
          계정 찾기
        </router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/password/reset">
          비밀번호 찾기
        </router-link>
      </nav>

      <p
        v-if="errorMessage"
        class="text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>
    </section>
  </main>
</template>
