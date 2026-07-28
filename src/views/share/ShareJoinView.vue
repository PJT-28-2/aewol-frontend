<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { shareApi } from '@/api/share'

const router = useRouter()
const link = ref('')
const isJoining = ref(false)
const errorMessage = ref('')

const accessId = computed(() => {
  const value = link.value.trim()
  if (!value) return ''

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    const isInvitePath =
      (url.hostname === 'aewol.app' && url.pathname.startsWith('/invite/')) ||
      (url.hostname === 'aewol.link' && url.pathname.startsWith('/share/'))
    if (!isInvitePath) return ''

    const code = url.pathname.split('/').filter(Boolean).pop()
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      code,
    )
      ? code
      : ''
  } catch {
    return ''
  }
})

async function joinShare() {
  errorMessage.value = ''

  if (!accessId.value) {
    errorMessage.value = '올바른 애월 초대링크를 입력해주세요.'
    return
  }

  isJoining.value = true
  try {
    await shareApi.respondInvite(accessId.value, 'ACCEPTED')
    await router.push('/share')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      '초대에 참여하지 못했어요. 링크가 만료되지 않았는지 확인해주세요.'
  } finally {
    isJoining.value = false
  }
}
</script>

<template>
  <main class="join screen">
    <button
      class="back"
      type="button"
      @click="router.back()"
    >
      ‹
    </button>
    <h1>초대링크 입력</h1>
    <p class="sub">
      가족이나 친구가 보낸 초대링크를 입력해주세요
    </p>
    <label for="invite-link">초대링크 *</label>
    <input
      id="invite-link"
      v-model="link"
      placeholder="aewol.app/invite/..."
      @input="errorMessage = ''"
    >
    <div class="hint">
      💡 초대링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다.
      링크를 복사해 입력해주세요.
    </div>
    <p
      v-if="errorMessage"
      class="feedback error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
    <button
      class="primary"
      type="button"
      :disabled="!link.trim() || isJoining"
      @click="joinShare"
    >
      {{ isJoining ? '참여 중...' : '참여하기' }}
    </button>
  </main>
</template>

<style scoped>
.screen {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, var(--mobile-content-width));
  min-height: 100vh;
  margin: 0 auto;
  padding: var(--space-10) var(--space-5);
  box-sizing: border-box;
  color: var(--color-navy);
  background: var(--color-white);
}

.back {
  position: absolute;
  top: var(--header-height);
  left: var(--space-5);
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-3xl);
  line-height: 1;
  cursor: pointer;
}

.screen h1 {
  margin: var(--space-7) 0 var(--space-1);
  font-size: var(--font-xl);
}

.sub {
  margin: 0 0 var(--space-8);
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}

.screen label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-slate-dark);
  font-size: var(--font-sm);
  font-weight: var(--font-bold);
}

.screen input {
  width: 100%;
  height: var(--control-height);
  padding: 0 var(--space-4);
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font: var(--font-md) var(--font-family);
}

.hint {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font-size: var(--font-sm);
  line-height: 1.45;
}

.feedback {
  margin: var(--space-4) 0 0;
  font-size: var(--font-sm);
}

.error {
  color: var(--color-danger);
}

.primary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: auto;
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-navy);
  color: var(--color-white);
  font-weight: var(--font-bold);
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
