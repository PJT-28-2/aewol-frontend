<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { shareApi } from '@/api/share'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'

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
  <main
    class="relative mx-auto flex min-h-screen w-full max-w-[var(--mobile-content-width)] box-border flex-col bg-(--color-white) px-[var(--space-5)] py-[var(--space-10)] text-(--color-navy)"
  >
    <button
      class="absolute left-[var(--space-5)] top-[var(--header-height)] cursor-pointer border-0 bg-transparent p-0 text-(--color-navy)"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <IconArrowLeft size="24" />
    </button>
    <h1
      class="mb-[var(--space-1)] mt-[var(--space-7)] text-[length:var(--font-xl)] font-bold"
    >
      초대링크 입력
    </h1>
    <p
      class="mb-[var(--space-8)] mt-0 text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      가족이나 친구가 보낸 초대링크를 입력해주세요
    </p>
    <label
      class="mb-[var(--space-2)] block text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)"
      for="invite-link"
    >초대링크 *</label>
    <input
      id="invite-link"
      v-model="link"
      class="h-[var(--control-height)] w-full box-border rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-surface) px-[var(--space-4)] [font-family:var(--font-family)] text-[length:var(--font-md)]"
      placeholder="aewol.app/invite/..."
      @input="errorMessage = ''"
    >
    <div
      class="mt-[var(--space-4)] flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-(--color-surface) p-[var(--space-4)] text-[length:var(--font-sm)] leading-[1.45] text-(--color-slate-dark)"
    >
      <IconInfo
        class="mt-0.5 shrink-0 text-(--color-gold-dark)"
        :size="17"
      />
      <span>
        초대링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다.
        링크를 복사해 입력해주세요.
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
      class="mt-auto h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white) disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      :disabled="!link.trim() || isJoining"
      @click="joinShare"
    >
      {{ isJoining ? '참여 중...' : '참여하기' }}
    </button>
  </main>
</template>
