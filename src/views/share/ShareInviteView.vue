<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { shareApi } from '@/api/share'
import IconChevronLeft from '@/components/common/icons/IconChevronLeft.vue'

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
  <main
    class="relative mx-auto min-h-screen w-full max-w-[var(--mobile-content-width)] box-border rounded-[var(--radius-sheet)] bg-(--color-white) px-[var(--space-5)] py-[var(--space-9)] text-(--color-navy)"
  >
    <div
      class="absolute left-1/2 top-[var(--space-4)] h-[var(--space-1)] w-[var(--space-8)] -translate-x-1/2 rounded-[var(--radius-sm)] bg-(--color-border)"
    />
    <button
      class="absolute left-[var(--space-4)] top-[var(--space-8)] cursor-pointer border-0 bg-transparent p-0 text-(--color-navy)"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <IconChevronLeft :size="28" />
    </button>
    <h1 class="m-0 text-[length:var(--font-lg)] font-bold">
      가족 초대하기
    </h1>
    <p
      class="mb-[var(--space-7)] mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      함께 돌보는 가족을 초대해 지갑을 공유해요
    </p>
    <label
      class="mb-[var(--space-2)] block text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)"
      for="recipient"
    >이메일, 전화번호 또는 멤버 ID</label>
    <input
      id="recipient"
      v-model="recipient"
      class="h-[var(--control-height)] w-full box-border rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) px-[var(--space-4)] [font-family:var(--font-family)] text-[length:var(--font-md)]"
      placeholder="example@aewol.com"
      @input="resetFeedback"
    >
    <button
      class="mt-[var(--space-4)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white) disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      :disabled="!trimmedRecipient || isSending"
      @click="sendInvite"
    >
      {{ isSending ? '초대 보내는 중...' : '초대 보내기' }}
    </button>
    <div
      class="mb-[var(--space-6)] mt-[var(--space-10)] border-t border-(--color-border) pt-[var(--space-4)] text-center text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      또는 링크로 참여 화면 공유
    </div>
    <div class="flex gap-[var(--space-4)]">
      <span
        class="min-h-[var(--control-height)] min-w-0 flex-1 [overflow-wrap:anywhere] rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) p-[var(--space-4)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      >{{ inviteLink }}</span>
      <button
        class="w-[calc(var(--space-8)*2)] cursor-pointer rounded-[var(--radius-lg)] border-0 bg-(--color-gold) font-bold text-(--color-navy)"
        type="button"
        @click="copyLink"
      >
        {{ copied ? '복사됨' : '복사' }}
      </button>
    </div>
    <p
      v-if="feedback"
      class="mb-0 mt-[var(--space-4)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      :class="{ 'text-(--color-danger)': isError }"
      :role="isError ? 'alert' : 'status'"
    >
      {{ feedback }}
    </p>
  </main>
</template>
