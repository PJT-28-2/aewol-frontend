<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import PinKeypad from '@/components/common/PinKeypad.vue';
import PinDots from '@/components/common/PinDots.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const store = useAccountStore();

// 새 PIN 입력을 건너뛰고 URL로 바로 들어오는 걸 막는 가드는 router의 beforeEnter로 옮겼어요.

// PasswordSetupComplete.vue 라우터 가드가 확인하는 플래그와 같은 방식(sessionStorage) —
// 재설정 API가 실제로 성공했을 때만 세팅해서, 완료 화면에 URL로 바로 들어오는 걸 막아요.
const PASSWORD_RESET_COMPLETED_KEY = 'simplePasswordResetCompleted';

const pin = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleComplete(value) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    const matched = await store.confirmSimplePasswordReset(value);
    if (!matched) {
      errorMessage.value = '입력한 비밀번호가 일치하지 않아요. 다시 입력해주세요';
      pin.value = '';
      return;
    }
    window.sessionStorage.setItem(PASSWORD_RESET_COMPLETED_KEY, 'true');
    router.replace({ name: 'SimplePasswordResetComplete' });
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '비밀번호 재설정에 실패했어요. 다시 시도해주세요';
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
          새 간편 비밀번호를 다시 입력해주세요
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          방금 입력한 숫자 6자리를 한 번 더 입력해주세요
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
