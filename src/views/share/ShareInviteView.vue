<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { shareApi } from '@/api/share'

const router = useRouter()
const recipient = ref('')
const copied = ref(false)
const isSending = ref(false)
const feedback = ref('')
const isError = ref(false)
const inviteLink = `${window.location.origin}/share/join`

const trimmedRecipient = computed(() => recipient.value.trim())
const isEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient.value),
)
const normalizedPhone = computed(() => recipient.value.replace(/\D/g, ''))
const isPhone = computed(() =>
  /^01[016789]\d{7,8}$/.test(normalizedPhone.value),
)
const isMemberId = computed(() =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    trimmedRecipient.value,
  ),
)
const isValidRecipient = computed(
  () => isEmail.value || isPhone.value || isMemberId.value,
)

function resetFeedback() {
  feedback.value = ''
  isError.value = false
}

async function sendInvite() {
  resetFeedback()

  if (!isValidRecipient.value) {
    feedback.value = '올바른 이메일, 휴대전화 번호 또는 멤버 ID를 입력해주세요.'
    isError.value = true
    return
  }

  isSending.value = true
  try {
    if (isMemberId.value) {
      await shareApi.invite({
        targetMemberId: trimmedRecipient.value,
        role: 'VIEWER',
      })
      feedback.value = '공동육아 초대를 보냈어요.'
      return
    }

    const body = encodeURIComponent(
      `애월에서 함께 돌보기에 초대했어요. ${inviteLink}`,
    )
    window.location.href = isEmail.value
      ? `mailto:${encodeURIComponent(trimmedRecipient.value)}?subject=${encodeURIComponent('애월 함께 돌보기 초대')}&body=${body}`
      : `sms:${normalizedPhone.value}?body=${body}`
    feedback.value = '초대 메시지를 보낼 앱을 열었어요.'
  } catch (error) {
    feedback.value =
      error.response?.data?.message ?? '초대를 보내지 못했어요. 다시 시도해주세요.'
    isError.value = true
  } finally {
    isSending.value = false
  }
}

async function copyLink() {
  resetFeedback()

  if (!navigator.clipboard?.writeText) {
    feedback.value = '이 브라우저에서는 링크 복사를 지원하지 않아요.'
    isError.value = true
    return
  }

  try {
    await navigator.clipboard.writeText(inviteLink)
    copied.value = true
    feedback.value = '참여 화면 링크를 복사했어요.'
  } catch {
    copied.value = false
    feedback.value = '링크를 복사하지 못했어요. 다시 시도해주세요.'
    isError.value = true
  }
}
</script>

<template>
  <main class="invite screen">
    <div class="grabber" />
    <button
      class="back"
      type="button"
      @click="router.back()"
    >
      ‹
    </button>
    <h1>가족 초대하기</h1>
    <p class="sub">
      함께 돌보는 가족을 초대해 지갑을 공유해요
    </p>
    <label for="recipient">이메일, 전화번호 또는 멤버 ID</label>
    <input
      id="recipient"
      v-model="recipient"
      placeholder="example@aewol.com"
      @input="resetFeedback"
    >
    <button
      class="primary"
      type="button"
      :disabled="!trimmedRecipient || isSending"
      @click="sendInvite"
    >
      {{ isSending ? '초대 보내는 중...' : '초대 보내기' }}
    </button>
    <div class="or">
      또는 링크로 참여 화면 공유
    </div>
    <div class="link-row">
      <span>{{ inviteLink }}</span>
      <button
        type="button"
        @click="copyLink"
      >
        {{ copied ? '복사됨' : '복사' }}
      </button>
    </div>
    <p
      v-if="feedback"
      class="feedback"
      :class="{ error: isError }"
      :role="isError ? 'alert' : 'status'"
    >
      {{ feedback }}
    </p>
  </main>
</template>

<style scoped>
.screen {
  position: relative;
  width: min(100%, var(--mobile-content-width));
  min-height: 100vh;
  margin: 0 auto;
  padding: var(--space-9) var(--space-5);
  box-sizing: border-box;
  color: var(--color-navy);
  background: var(--color-white);
  border-radius: var(--radius-sheet);
}

.grabber {
  position: absolute;
  top: var(--space-4);
  left: calc(50% - var(--space-5));
  width: var(--space-8);
  height: var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-border);
}

.back {
  position: absolute;
  top: var(--space-8);
  left: var(--space-4);
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-3xl);
  cursor: pointer;
}

.screen h1 {
  margin: 0;
  font-size: var(--font-lg);
}

.sub {
  margin: var(--space-2) 0 var(--space-7);
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

.primary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: var(--space-4);
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

.or {
  margin: var(--space-10) 0 var(--space-6);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
  text-align: center;
}

.link-row {
  display: flex;
  gap: var(--space-4);
}

.link-row span {
  flex: 1;
  min-width: 0;
  min-height: var(--control-height);
  padding: var(--space-4);
  box-sizing: border-box;
  overflow-wrap: anywhere;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font-size: var(--font-sm);
}

.link-row button {
  width: calc(var(--space-8) * 2);
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-gold);
  color: var(--color-navy);
  font-weight: var(--font-bold);
  cursor: pointer;
}

.feedback {
  margin: var(--space-4) 0 0;
  color: var(--color-slate-dark);
  font-size: var(--font-sm);
}

.error {
  color: var(--color-danger);
}
</style>
