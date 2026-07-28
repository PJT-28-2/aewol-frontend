<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import loginIllustration from '@/assets/images/auth/login-illustration.png'
import aewolLogo from '@/assets/images/auth/aewol-logo.png'

const router = useRouter()
const authStore = useAuthStore()

const showEmailForm = ref(false)
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState'
let loginAttemptId = 0

/**
 * 카카오 인증 요청과 콜백을 연결할 일회성 CSRF 방지 값을 생성한다.
 * 예측 가능성을 낮추기 위해 브라우저의 암호학적 난수 생성기를 사용한다.
 *
 * @returns {string} 32바이트 난수를 16진수로 변환한 OAuth state
 */
const createOAuthState = () => {
  const randomBytes = new Uint8Array(32)
  window.crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

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
    await router.push('/home')
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
  // =========================
  // OAuth 설정 검증
  // =========================
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/callback/kakao`

  if (!clientId) {
    errorMessage.value = '카카오 로그인 설정을 확인해 주세요.'
    return
  }

  // =========================
  // CSRF 방지 상태 생성
  // =========================
  const state = createOAuthState()
  // 다른 탭의 OAuth 요청과 섞이지 않도록 현재 탭에 한정된 sessionStorage를 사용한다.
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state)

  // =========================
  // 카카오 인증 화면 이동
  // =========================
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })

  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
}
</script>

<template>
  <main
    class="mx-auto min-h-svh w-[min(100%,390px)] overflow-hidden rounded-[40px] bg-(--color-white) min-[391px]:my-[max(0px,calc((100svh-844px)/2))] min-[391px]:min-h-[844px] min-[391px]:shadow-(--shadow-lg) max-h-[700px]:min-h-[700px]"
  >
    <template v-if="!showEmailForm">
      <section
        class="relative h-[480px] bg-(--color-pastel-blue) max-h-[700px]:h-[420px]"
        aria-labelledby="login-title"
      >
        <h1 id="login-title" class="sr-only">애월 로그인</h1>

        <div
          class="absolute top-[93px] left-[89px] h-[174px] w-[180px] overflow-hidden max-h-[700px]:top-[52px]"
        >
          <img
            class="absolute top-[-20.73%] left-[-40.17%] h-[198.31%] w-[191.26%] max-w-none"
            :src="loginIllustration"
            alt=""
          />
        </div>

        <img
          class="absolute top-[286px] left-1/2 h-[58px] w-[120px] -translate-x-1/2 object-cover max-h-[700px]:top-[245px]"
          :src="aewolLogo"
          alt="애월"
        />
        <p
          class="absolute top-[363px] w-full text-center text-[13px] leading-[1.3] text-(color:--color-slate-dark) max-h-[700px]:top-[322px]"
        >
          반려동물을 위한, 전자 지갑
        </p>
      </section>

      <section
        class="relative flex flex-col gap-[14px] px-[26px] pt-[60px] pb-8 max-h-[700px]:pt-9"
        aria-label="로그인 메뉴"
      >
        <button
          class="flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-[#fee500] text-[14.5px] leading-[1.3] font-(--font-bold) text-[#181600]"
          type="button"
          @click="handleKakaoLogin"
        >
          카카오로 3초만에 시작하기
        </button>
        <button
          class="flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-(--color-navy) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-white)"
          type="button"
          @click="openEmailLogin"
        >
          이메일로 로그인
        </button>

        <nav
          class="mt-[9px] flex justify-center gap-[7px] text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          aria-label="회원 메뉴"
        >
          <router-link to="/signup">회원가입</router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/id/find">아이디 찾기</router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/password/reset">비밀번호 찾기</router-link>
        </nav>
        <p
          v-if="errorMessage"
          class="text-center text-(length:--font-sm) text-(color:--color-danger)"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </section>
    </template>

    <section
      v-else
      class="relative min-h-[700px] px-[22px] pt-[108px] pb-8"
      aria-labelledby="email-login-title"
    >
      <button
        class="absolute top-[60px] left-[22px] size-[26px] text-(color:--color-navy)"
        type="button"
        aria-label="이전 화면으로 돌아가기"
        @click="closeEmailLogin"
      >
        <IconArrowLeft :size="26" />
      </button>

      <h2
        id="email-login-title"
        class="text-(length:--font-xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        이메일로 로그인
      </h2>
      <p class="mt-[3px] text-[12.5px] leading-[1.3] text-(color:--color-slate-muted)">
        계정 정보를 입력해주세요
      </p>

      <form class="mt-9 flex flex-col" @submit.prevent="handleEmailLogin">
        <label
          class="mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="email"
        >
          이메일
        </label>
        <input
          id="email"
          v-model="email"
          class="h-[46px] w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="email"
          autocomplete="email"
          placeholder="example@aewol.com"
          required
        />
        <label
          class="mt-[11px] mb-1 text-[12.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-dark)"
          for="password"
        >
          비밀번호
        </label>
        <input
          id="password"
          v-model="password"
          class="h-[46px] w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
          type="password"
          autocomplete="current-password"
          placeholder="8자 이상 입력해주세요"
          minlength="8"
          required
        />
        <button
          class="mt-6 flex h-[52px] w-full items-center justify-center rounded-(--radius-xl) bg-(--color-gold) text-[14.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy) disabled:cursor-wait disabled:opacity-65"
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
        <router-link to="/signup">회원가입</router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/id/find">아이디 찾기</router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/password/reset">비밀번호 찾기</router-link>
      </nav>

      <p
        v-if="errorMessage"
        class="text-center text-(length:--font-sm) text-(color:--color-danger)"
        role="alert"
      >
        {{ errorMessage }}
      </p>
    </section>
  </main>
</template>
