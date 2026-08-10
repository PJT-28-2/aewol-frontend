<script setup>
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useShareStore } from '@/stores/share'

const props = defineProps({
  petId: {
    type: String,
    required: true,
  },
})

const shareStore = useShareStore()
const recipient = ref('')
const copied = ref(false)
const feedback = ref('')
const isError = ref(false)
const inviteCode = ref('')
const inviteLink = computed(() =>
  inviteCode.value
    ? `${window.location.origin}/share/join?invite=${inviteCode.value}`
    : '',
)

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

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

async function sendInvite() {
  resetFeedback()

  if (!isValidRecipient.value) {
    feedback.value = '이메일 또는 휴대전화 번호를 확인해 주세요.'
    isError.value = true
    return
  }

  if (!props.petId) {
    feedback.value = '초대할 반려동물을 먼저 선택해 주세요.'
    isError.value = true
    return
  }

  try {
    const invite = await shareStore.invite(props.petId, trimmedRecipient.value)
    inviteCode.value = invite.inviteCode
    copied.value = false
    feedback.value = '초대를 만들었어요. 아래 참여 링크를 전달해 주세요.'
  } catch (error) {
    feedback.value = getErrorMessage(error, '초대를 만들지 못했어요. 다시 시도해 주세요.')
    isError.value = true
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
    if (!inviteLink.value) {
      if (!props.petId) throw new Error('PET_REQUIRED')
      const invite = await shareStore.createLinkInvite(props.petId)
      inviteCode.value = invite.inviteCode
    }
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    feedback.value = '참여 링크를 복사했어요.'
  } catch (error) {
    copied.value = false
    feedback.value = getErrorMessage(error, '링크를 만들거나 복사하지 못했어요. 다시 시도해 주세요.')
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
      함께 돌볼 가족을 초대해 반려동물의 기록을 나눠요
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
      :disabled="!trimmedRecipient || !petId || shareStore.isInviting"
      :loading="shareStore.isInviting"
    >
      초대 링크 만들기
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
          {{ inviteLink || '복사 버튼을 누르면 새 참여 링크가 만들어져요.' }}
        </span>
        <AppButton
          class="shrink-0"
          size="md"
          variant="primary"
          type="button"
          :disabled="!petId || shareStore.isInviting"
          :loading="shareStore.isInviting"
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
