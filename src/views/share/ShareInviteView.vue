<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useShareStore } from '@/stores/share'

const props = defineProps({
  petId: {
    type: String,
    required: true,
  },
})

// 받는 사람을 지정하지 않으므로, 링크가 살아 있는 동안은 그것을 본 누구나 들어올 수
// 있다. 그래서 기본을 짧게 두고 길게 여는 쪽을 예외로 만든다.
const TTL_OPTIONS = [
  { minutes: 5, label: '5분' },
  { minutes: 10, label: '10분' },
  { minutes: 30, label: '30분' },
]
const DEFAULT_TTL_MINUTES = 10

const shareStore = useShareStore()
const selectedMinutes = ref(DEFAULT_TTL_MINUTES)
const inviteCode = ref('')
const expiresAt = ref(null)
const now = ref(Date.now())
const copied = ref(false)
const feedback = ref('')
const isError = ref(false)

let ticker = null

const inviteLink = computed(() =>
  inviteCode.value
    ? `${window.location.origin}/share/join?invite=${inviteCode.value}`
    : '',
)

const remainingMs = computed(() =>
  expiresAt.value ? Math.max(0, expiresAt.value - now.value) : 0,
)

const isExpired = computed(() => Boolean(inviteCode.value) && remainingMs.value === 0)

/** 남은 시간을 m:ss로. 초까지 보여야 링크를 오래 굴리지 않는다. */
const remainingLabel = computed(() => {
  const totalSeconds = Math.ceil(remainingMs.value / 1000)
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
})

function stopTicker() {
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

function startTicker() {
  stopTicker()
  now.value = Date.now()
  ticker = setInterval(() => {
    now.value = Date.now()
    if (remainingMs.value === 0) stopTicker()
  }, 1000)
}

function resetFeedback() {
  feedback.value = ''
  isError.value = false
}

function fail(error, fallback) {
  feedback.value = error?.response?.data?.message || fallback
  isError.value = true
}

function selectMinutes(minutes) {
  selectedMinutes.value = minutes
  // 유효시간을 바꿨는데 이전 링크가 남아 있으면 어느 쪽이 유효한지 헷갈린다.
  inviteCode.value = ''
  expiresAt.value = null
  copied.value = false
  stopTicker()
  resetFeedback()
}

async function createLink() {
  resetFeedback()
  if (!props.petId) {
    feedback.value = '초대할 반려동물을 먼저 선택해 주세요.'
    isError.value = true
    return
  }

  try {
    const invite = await shareStore.createLinkInvite(props.petId, selectedMinutes.value)
    inviteCode.value = invite.inviteCode
    // 서버가 준 만료 시각을 그대로 쓴다. 여기서 다시 계산하면 요청이 오가는 동안의
    // 지연만큼 실제보다 길게 보인다.
    expiresAt.value = invite.expiresAt ? new Date(invite.expiresAt).getTime() : null
    copied.value = false
    startTicker()
    feedback.value = '링크를 만들었어요. 만료되기 전에 전달해 주세요.'
  } catch (error) {
    fail(error, '초대 링크를 만들지 못했어요. 다시 시도해 주세요.')
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
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    feedback.value = '참여 링크를 복사했어요.'
  } catch (error) {
    copied.value = false
    fail(error, '링크를 복사하지 못했어요. 다시 시도해 주세요.')
  }
}

onBeforeUnmount(stopTicker)
</script>

<template>
  <form
    class="text-(--color-navy)"
    @submit.prevent="createLink"
  >
    <p class="mb-[var(--space-6)] mt-0 text-[length:var(--font-sm)] text-(--color-slate-muted)">
      함께 돌볼 가족을 초대해 반려동물의 기록을 나눠요
    </p>

    <span class="mb-[var(--space-2)] block text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)">
      링크가 살아 있는 시간
    </span>
    <div
      class="flex gap-[var(--space-2)]"
      role="group"
      aria-label="링크가 살아 있는 시간"
    >
      <AppButton
        v-for="option in TTL_OPTIONS"
        :key="option.minutes"
        class="flex-1"
        type="button"
        size="md"
        :variant="selectedMinutes === option.minutes ? 'navy' : 'secondary'"
        :aria-pressed="selectedMinutes === option.minutes"
        @click="selectMinutes(option.minutes)"
      >
        {{ option.label }}
      </AppButton>
    </div>

    <!--
      링크를 본 사람은 누구나 수락할 수 있다. 이 사실을 시간을 고르는 자리에서 바로
      알려야 짧게 잡는다. 뒤에서 알려주면 이미 링크를 뿌린 뒤다.
    -->
    <p class="mb-0 mt-[var(--space-2)] text-[length:var(--font-xs)] leading-[1.5] text-(--color-slate-muted)">
      이 시간 안에 링크를 받은 사람은 누구나 참여할 수 있어요.
      한 명이 참여하면 링크는 바로 만료돼요.
    </p>

    <AppButton
      class="mt-[var(--space-5)]"
      block
      size="lg"
      variant="navy"
      type="submit"
      :disabled="!petId || shareStore.isInviting"
      :loading="shareStore.isInviting"
    >
      {{ inviteCode ? '새 링크 만들기' : '초대 링크 만들기' }}
    </AppButton>

    <section
      v-if="inviteCode"
      class="mt-[var(--space-5)] rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) p-[var(--space-4)]"
      aria-label="만들어진 초대 링크"
    >
      <div class="flex items-center justify-between gap-[var(--space-2)]">
        <strong class="text-[length:var(--font-sm)] text-(--color-slate-dark)">참여 링크</strong>
        <span
          class="shrink-0 text-[length:var(--font-sm)] font-bold [font-variant-numeric:tabular-nums]"
          :class="isExpired ? 'text-(--color-danger-strong)' : 'text-(--color-leaf-dark)'"
          role="status"
          aria-live="polite"
        >
          {{ isExpired ? '만료됨' : `${remainingLabel} 남음` }}
        </span>
      </div>

      <p
        class="mb-0 mt-[var(--space-3)] [overflow-wrap:anywhere] text-[length:var(--font-sm)]"
        :class="isExpired ? 'text-(--color-slate-muted) line-through' : 'text-(--color-slate-dark)'"
      >
        {{ inviteLink }}
      </p>

      <AppButton
        class="mt-[var(--space-3)]"
        block
        size="md"
        variant="primary"
        type="button"
        :disabled="isExpired"
        @click="copyLink"
      >
        {{ copied ? '복사됨' : '링크 복사' }}
      </AppButton>

      <p
        v-if="isExpired"
        class="mb-0 mt-[var(--space-3)] text-[length:var(--font-xs)] text-(--color-slate-muted)"
      >
        시간이 지나 링크가 만료됐어요. 위에서 새 링크를 만들어 주세요.
      </p>
    </section>

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
