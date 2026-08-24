<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import PinKeypad from '@/components/common/PinKeypad.vue';
import PinDots from '@/components/common/PinDots.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const store = useAccountStore();

// 재설정 플로우를 새로 시작하는 화면이라, 이전에 남아있을 수 있는 상태(예: 뒤로가기 후
// 재진입)를 먼저 지워요 — resetting.currentPassword가 남아있으면 다음 화면 가드를 그냥
// 통과해버려서 현재 PIN 확인을 건너뛰게 될 수 있어요.
store.resetSimplePasswordResetState();

const pin = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleComplete(value) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    const verified = await store.verifyCurrentSimplePassword(value);
    if (!verified) {
      errorMessage.value = '비밀번호가 일치하지 않아요. 다시 입력해주세요';
      pin.value = '';
      return;
    }
    router.push({ name: 'SimplePasswordResetNew' });
  } catch (error) {
    // Confirm 화면과 동일하게 서버 메시지를 우선 보여줘요 (예: 잠금 등 사유 안내).
    errorMessage.value = error.response?.data?.message ?? '확인에 실패했어요. 다시 시도해주세요';
    pin.value = '';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="h-[calc(100svh-var(--header-height))] flex flex-col overflow-y-auto bg-(--color-app-bg)">
    <div class="mx-auto w-full max-w-(--content-max-width) px-(--space-5) pt-(--space-7) text-center">
      <header class="mb-(--space-4)">
        <span class="mx-auto mb-(--space-4) flex size-[52px] items-center justify-center rounded-[18px] bg-(--color-leaf-soft)">
          <IconLock
            :size="22"
            color="var(--color-leaf-dark)"
          />
        </span>
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
          현재 간편 비밀번호를 입력해주세요
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          본인 확인을 위해 지금 사용 중인 숫자 6자리를 입력해주세요
        </p>
      </header>

      <PinDots
        :model-value="pin"
        :length="6"
      />

      <div
        v-if="errorMessage"
        class="rounded-(--radius-lg) p-(--space-3) mt-(--space-6) text-center bg-(--color-danger-soft)"
      >
        <p class="text-(length:--font-sm) text-(color:--color-danger-muted)">
          {{ errorMessage }}
        </p>
      </div>
    </div>

    <div class="mx-auto mt-auto w-full max-w-(--content-max-width) rounded-t-[32px] border-x border-t border-(--color-card-border) bg-(--color-leaf-soft) px-(--space-7) pt-(--space-5) pb-(--space-7) shadow-[0_-10px_30px_color-mix(in_srgb,var(--color-brand-dark)_6%,transparent)]">
      <PinKeypad
        v-model="pin"
        @complete="handleComplete"
      />
    </div>
  </div>
</template>
