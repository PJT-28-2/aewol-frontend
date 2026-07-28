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

const createOAuthState = () => {
  const randomBytes = new Uint8Array(32)
  window.crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

const handleEmailLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    await router.push('/home')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '이메일 또는 비밀번호를 확인해 주세요.'
  } finally {
    isLoading.value = false
  }
}

const handleKakaoLogin = () => {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/callback/kakao`

  if (!clientId) {
    errorMessage.value = '카카오 로그인 설정을 확인해 주세요.'
    return
  }

  const state = createOAuthState()
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state)

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
          @click="showEmailForm = true"
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
        @click="showEmailForm = false"
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
  background: #edf0f7;
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
