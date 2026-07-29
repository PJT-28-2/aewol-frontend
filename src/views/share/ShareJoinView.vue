<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import { buildMockInviteLink, MOCK_INVITE_CODE } from '@/mocks/share'
import { useShareStore } from '@/stores/share'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const inviteLink = buildMockInviteLink()
const link = ref(route.query.invite === MOCK_INVITE_CODE ? inviteLink : '')
const isJoining = ref(false)
const errorMessage = ref('')

const hasValidMockInvite = computed(() => {
  const value = link.value.trim()
  if (!value) return false

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value)
    return url.searchParams.get('invite') === MOCK_INVITE_CODE
  } catch {
    return false
  }
})

async function joinShare() {
  errorMessage.value = ''

  if (!hasValidMockInvite.value) {
    errorMessage.value = '유효한 초대 링크를 입력해 주세요.'
    return
  }

  isJoining.value = true
  try {
    shareStore.joinMockSharedCare()
    await router.push('/share')
  } finally {
    isJoining.value = false
  }
}
</script>

<template>
  <main
    class="relative mx-auto flex min-h-dvh w-full max-w-[var(--mobile-content-width)] box-border flex-col bg-(--color-white) px-[var(--space-5)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] pt-[calc(var(--header-height)+var(--space-8))] text-(--color-navy)"
  >
    <button
      class="absolute left-[var(--space-5)] top-[var(--header-height)] cursor-pointer border-0 bg-transparent p-0 text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="16" />
    </button>

    <h1 class="m-0 text-[length:var(--font-xl)] font-bold">
      초대 링크 입력
    </h1>
    <p
      class="mb-[var(--space-7)] mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      가족이나 친구가 보낸 초대 링크를 입력해주세요
    </p>

    <label
      class="mb-[var(--space-2)] block text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)"
      for="invite-link"
    >
      초대 링크 *
    </label>
    <input
      id="invite-link"
      v-model="link"
      class="h-[var(--control-height)] w-full box-border rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) px-[var(--space-4)] [font-family:var(--font-family)] text-[length:var(--font-md)] text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      placeholder="aewol.link/share/abc123..."
      @input="errorMessage = ''"
    >
    <div
      class="mt-[var(--space-4)] flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-(--color-surface) p-[var(--space-4)] text-[length:var(--font-sm)] leading-[1.45] text-(--color-slate-dark)"
    >
      <IconInfo
        class="mt-[var(--space-1)] shrink-0 text-(--color-gold-dark)"
        :size="16"
      />
      <span>
        초대 링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다. 링크를 복사해 입력해주세요.
      </span>
    </div>
    <p
      v-if="errorMessage"
      class="mb-0 mt-[var(--space-4)] text-[length:var(--font-sm)] text-(--color-danger)"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <button
      class="mt-auto h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      type="button"
      :disabled="!link.trim() || isJoining"
      @click="joinShare"
    >
      {{ isJoining ? '참여 중...' : '참여하기' }}
    </button>
  </main>
</template>
