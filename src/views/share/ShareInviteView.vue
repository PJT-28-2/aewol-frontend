<script setup>
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { buildMockInviteLink } from '@/mocks/share'
import { useShareStore } from '@/stores/share'

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
  feedback.value = '목업 초대 링크를 준비했어요.'
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
  <form
    class="text-(--color-navy)"
    @submit.prevent="sendInvite"
  >
    <p
      class="mb-[var(--space-7)] mt-0 text-[length:var(--font-sm)] text-(--color-slate-muted)"
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
    <AppButton
      class="mt-[var(--space-4)]"
      block
      size="lg"
      variant="navy"
      type="submit"
      :disabled="!trimmedRecipient"
    >
      초대 보내기
    </AppButton>

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
        <AppButton
          class="shrink-0"
          size="md"
          variant="primary"
          type="button"
          @click="copyLink"
        >
          {{ copied ? '복사됨' : '복사' }}
        </AppButton>
      </div>
    </div>
    <p
      v-if="feedback"
      class="mb-0 mt-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      :class="{ 'text-(--color-danger-strong)': isError }"
      :role="isError ? 'alert' : 'status'"
    >
      {{ feedback }}
    </p>
  </form>
</template>
