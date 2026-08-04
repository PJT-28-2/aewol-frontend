<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import { useShareStore } from '@/stores/share'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const link = ref(
  route.query.invite
    ? `${window.location.origin}/share/join?invite=${route.query.invite}`
    : '',
)
const isJoining = ref(false)
const errorMessage = ref('')
const inviteDetail = ref(null)

const inviteCode = computed(() => {
  const value = link.value.trim()
  if (!value) return ''
  if (/^[a-zA-Z0-9-]{8,64}$/.test(value)) return value

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value)
    return url.searchParams.get('invite') || ''
  } catch {
    return ''
  }
});

// 검증 요청이 대기하는 동안 입력이 바뀔 수 있어, 호출 시점의 코드를 캡처해
// 검증·표시·수락에 같은 값만 사용하고 뒤늦게 도착한 이전 응답은 무시한다.
async function validateInvite(code = inviteCode.value) {
  errorMessage.value = ''
  inviteDetail.value = null
  if (!code) return false
  try {
    const detail = await shareStore.getInvite(code)
    if (code !== inviteCode.value) return false
    inviteDetail.value = detail
    return true
  } catch (error) {
    if (code === inviteCode.value) {
      errorMessage.value = error.response?.data?.message || '유효하지 않거나 만료된 초대 링크예요.'
    }
    return false
  }
}

async function joinShare() {
  errorMessage.value = '';
  const code = inviteCode.value

  if (!code) {
    errorMessage.value = '유효한 초대 링크를 입력해 주세요.'
    return
  }

  isJoining.value = true;
  try {
    if (!(await validateInvite(code))) return
    await shareStore.joinSharedCare(code)
    await router.push('/share')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '공동육아에 참여하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isJoining.value = false;
  }
}

onMounted(() => {
  if (inviteCode.value) validateInvite()
})
</script>

<template>
  <main
    class="relative mx-auto flex min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border flex-col bg-(--color-white) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <h1 class="m-0 text-[length:var(--font-2xl)] font-bold">
      초대 링크 입력
    </h1>
    <p
      class="mb-[var(--space-7)] mt-[var(--space-1)] text-[length:var(--font-md)] text-(--color-slate-muted)"
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
      @input="errorMessage = ''; inviteDetail = null"
    >
    <div
      class="mt-[var(--space-4)] flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-(--color-surface) p-[var(--space-4)] text-[length:var(--font-sm)] leading-[1.45] text-(--color-slate-dark)"
    >
      <IconInfo
        class="mt-[var(--space-1)] shrink-0 text-(--color-gold-dark)"
        :size="16"
      />
      <span>
        초대 링크는 이메일, 카카오톡, 문자 등으로 전달받을 수 있습니다. 링크를 복사해 입력해주세요.
      </span>
    </div>
    <p
      v-if="inviteDetail"
      class="mb-0 mt-[var(--space-4)] rounded-[var(--radius-lg)] bg-(--color-olive-surface) p-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-olive)"
      role="status"
    >
      {{ inviteDetail.inviterName }}님이 {{ inviteDetail.petName }}의 공동육아에 초대했어요.
    </p>
    <p
      v-if="errorMessage"
      class="mb-0 mt-[var(--space-4)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <AppButton
      class="mt-auto"
      block
      size="lg"
      variant="navy"
      :disabled="!inviteCode || isJoining"
      :loading="isJoining"
      @click="joinShare"
    >
      참여하기
    </AppButton>
  </main>
</template>
