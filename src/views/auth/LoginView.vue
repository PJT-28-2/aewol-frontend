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
  <main class="login-page">
    <template v-if="!showEmailForm">
      <section class="login-hero" aria-labelledby="login-title">
        <h1 id="login-title" class="sr-only">애월 로그인</h1>

        <div class="login-illustration">
          <img :src="loginIllustration" alt="" />
        </div>

        <img class="login-logo" :src="aewolLogo" alt="애월" />
        <p class="login-tagline">반려동물을 위한, 전자 지갑</p>
      </section>

      <section class="login-actions" aria-label="로그인 메뉴">
        <button class="login-button login-button--kakao" type="button" @click="handleKakaoLogin">
          카카오로 3초만에 시작하기
        </button>
        <button
          class="login-button login-button--email"
          type="button"
          @click="openEmailLogin"
        >
          이메일로 로그인
        </button>

        <nav class="login-links" aria-label="회원 메뉴">
          <router-link to="/signup">회원가입</router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/id/find">아이디 찾기</router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/password/reset">비밀번호 찾기</router-link>
        </nav>
        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
      </section>
    </template>

    <section v-else class="email-login" aria-labelledby="email-login-title">
      <button
        class="email-login__back"
        type="button"
        aria-label="이전 화면으로 돌아가기"
        @click="closeEmailLogin"
      >
        <IconArrowLeft :size="26" />
      </button>

      <h2 id="email-login-title" class="email-login__title">이메일로 로그인</h2>
      <p class="email-login__description">계정 정보를 입력해주세요</p>

      <form class="email-form" @submit.prevent="handleEmailLogin">
        <label for="email">이메일</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="example@aewol.com"
          required
        />
        <label for="password">비밀번호</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="8자 이상 입력해주세요"
          minlength="8"
          required
        />
        <button class="login-button login-button--email" type="submit" :disabled="isLoading">
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <nav class="login-links email-login__links" aria-label="회원 메뉴">
        <router-link to="/signup">회원가입</router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/id/find">아이디 찾기</router-link>
        <span aria-hidden="true">|</span>
        <router-link to="/password/reset">비밀번호 찾기</router-link>
      </nav>

      <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  width: min(100%, 390px);
  min-height: 100svh;
  margin: 0 auto;
  overflow: hidden;
  background: var(--color-white);
  border-radius: 40px;
}

.login-hero {
  position: relative;
  height: 480px;
  background: var(--color-pastel-blue);
}

.login-illustration {
  position: absolute;
  top: 93px;
  left: 89px;
  width: 180px;
  height: 174px;
  overflow: hidden;
}

.login-illustration img {
  position: absolute;
  top: -20.73%;
  left: -40.17%;
  width: 191.26%;
  height: 198.31%;
  max-width: none;
}

.login-logo {
  position: absolute;
  top: 286px;
  left: 50%;
  width: 120px;
  height: 58px;
  object-fit: cover;
  transform: translateX(-50%);
}

.login-tagline {
  position: absolute;
  top: 363px;
  width: 100%;
  color: var(--color-slate-dark);
  font-size: 13px;
  line-height: 1.3;
  text-align: center;
}

.login-actions {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 60px 26px 32px;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  border-radius: var(--radius-xl);
  font-size: 14.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.login-button--kakao {
  color: #181600;
  background: #fee500;
}

.login-button--email {
  color: var(--color-white);
  background: var(--color-navy);
}

.login-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.login-links {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-top: 9px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.email-form {
  display: flex;
  flex-direction: column;
}

.email-login {
  position: relative;
  min-height: 700px;
  padding: 108px 22px 32px;
}

.email-login__back {
  position: absolute;
  top: 60px;
  left: 22px;
  width: 26px;
  height: 26px;
  color: var(--color-navy);
}

.email-login__title {
  color: var(--color-navy);
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.email-login__description {
  margin-top: 3px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
  line-height: 1.3;
}

.email-form {
  margin-top: 36px;
}

.email-form label {
  margin-bottom: 4px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
  line-height: 1.3;
}

.email-form input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  color: var(--color-navy);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  outline: none;
}

.email-form input + label {
  margin-top: 11px;
}

.email-form input::placeholder {
  color: var(--color-slate-muted);
  opacity: 1;
}

.email-form input:focus {
  border-color: var(--color-navy);
}

.email-form .login-button {
  margin-top: 24px;
  color: var(--color-navy);
  background: var(--color-gold);
}

.email-login__links {
  margin-top: 15px;
}

.login-error {
  color: var(--color-danger);
  font-size: var(--font-sm);
  text-align: center;
}

@media (min-width: 391px) {
  .login-page {
    min-height: 844px;
    margin-block: max(0px, calc((100svh - 844px) / 2));
    box-shadow: var(--shadow-lg);
  }
}

@media (max-height: 700px) {
  .login-page {
    min-height: 700px;
  }

  .login-hero {
    height: 420px;
  }

  .login-illustration {
    top: 52px;
  }

  .login-logo {
    top: 245px;
  }

  .login-tagline {
    top: 322px;
  }

  .login-actions {
    padding-top: 36px;
  }
}
</style>
