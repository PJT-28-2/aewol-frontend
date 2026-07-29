<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import { buildMockInviteLink } from '@/mocks/share'
import { useShareStore } from '@/stores/share'

const router = useRouter()
const shareStore = useShareStore()
const recipient = ref('')
const copied = ref(false)
const feedback = ref('')
const isError = ref(false)
const inviteLink = buildMockInviteLink()

const trimmedRecipient = computed(() => recipient.value.trim())
const isEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient.value),
)
const normalizedPhone = computed(() => recipient.value.replace(/\D/g, ''))
const isPhone = computed(() => /^01[016789]\d{7,8}$/.test(normalizedPhone.value))
const isValidRecipient = computed(() => isEmail.value || isPhone.value)

function resetFeedback() {
  feedback.value = ''
  isError.value = false
}

function sendInvite() {
  resetFeedback()

  if (!isValidRecipient.value) {
    feedback.value = '이메일 또는 휴대전화 번호를 확인해 주세요.'
    isError.value = true
    return
  }

  shareStore.createMockInvite(trimmedRecipient.value)
  feedback.value = '초대를 준비했어요.'
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
    feedback.value = '참여 링크를 복사했어요.'
  } catch {
    copied.value = false
    feedback.value = '링크를 복사하지 못했어요. 다시 시도해 주세요.'
    isError.value = true
  }
}
</script>

<template>
  <main
    class="relative mx-auto min-h-[460px] w-full max-w-[var(--mobile-content-width)] box-border rounded-t-[var(--radius-sheet)] bg-(--color-white) px-[var(--space-5)] pb-[calc(var(--space-8)+env(safe-area-inset-bottom))] pt-[var(--space-9)] text-(--color-navy)"
  >
    <div
      class="absolute left-1/2 top-[var(--space-3)] h-[var(--space-1)] w-[var(--space-8)] -translate-x-1/2 rounded-[var(--radius-sm)] bg-(--color-border)"
    />
    <button
      class="absolute left-[var(--space-4)] top-[var(--space-8)] cursor-pointer border-0 bg-transparent p-0 text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="16" />
    </button>

    <h1 class="m-0 text-[length:var(--font-lg)] font-bold">
      가족 초대하기
    </h1>
    <p
      class="mb-[var(--space-7)] mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      함께 돌보기의 가족을 초대해 지갑을 공유해요
    </p>

    <label
      class="mb-[var(--space-2)] block text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)"
      for="recipient"
    >
      이메일 또는 휴대전화 번호
    </label>
    <input
      id="recipient"
      v-model="recipient"
      class="h-[var(--control-height)] w-full box-border rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) px-[var(--space-4)] [font-family:var(--font-family)] text-[length:var(--font-md)] text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      placeholder="example@aewol.com"
      @input="resetFeedback"
    >
    <button
      class="mt-[var(--space-4)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      type="button"
      :disabled="!trimmedRecipient"
      @click="sendInvite"
    >
      초대 보내기
    </button>

    <div class="mt-[var(--space-7)] border-t border-(--color-border) pt-[var(--space-4)]">
      <p
        class="m-0 text-center text-[length:var(--font-sm)] font-bold text-(--color-slate-muted)"
      >
        또는 링크로 초대
      </p>
      <div class="mt-[var(--space-4)] flex gap-[var(--space-4)]">
        <span
          class="min-w-0 flex-1 [overflow-wrap:anywhere] rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >
          {{ inviteLink }}
        </span>
        <button
          class="h-[var(--control-height)] w-[var(--share-icon-size)] shrink-0 cursor-pointer rounded-[var(--radius-lg)] border-0 bg-(--color-gold) text-[length:var(--font-sm)] font-bold text-(--color-navy) transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
          type="button"
          @click="copyLink"
        >
          {{ copied ? '복사됨' : '복사' }}
        </button>
      </div>
    </div>
    <p
      v-if="feedback"
      class="mb-0 mt-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      :class="{ 'text-(--color-danger)': isError }"
      :role="isError ? 'alert' : 'status'"
    >
      {{ feedback }}
    </p>
  </main>
</template>
