<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getPinWeaknessReason } from '@/utils/pin';
import PinKeypad from '@/components/common/PinKeypad.vue';
import PinDots from '@/components/common/PinDots.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const store = useAccountStore();

// 현재 PIN 확인을 건너뛰고 URL로 바로 들어오는 걸 막아요.
if (!store.resetting.currentPassword) {
  router.replace({ name: 'SimplePasswordResetVerify' });
}

const pin = ref('');
const pinError = ref('');

// AccountPasswordSetupView.vue와 동일한 규칙 — utils/pin.js를 함께 사용해요.
function handleComplete(value) {
  const reason = getPinWeaknessReason(value);
  if (reason === 'sequential') {
    pinError.value = '연속된 숫자예요. 다른 비밀번호를 입력해주세요';
    pin.value = '';
    return;
  }
  if (reason === 'weak') {
    pinError.value = '유추하기 쉬운 숫자예요. 다른 비밀번호를 입력해주세요';
    pin.value = '';
    return;
  }
  store.setResetPendingPassword(value);
  router.push({ name: 'SimplePasswordResetConfirm' });
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
          새 간편 비밀번호를 입력해주세요
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          결제할 때 사용할 숫자 6자리를 입력해주세요
        </p>
      </header>

      <PinDots
        :model-value="pin"
        :length="6"
      />

      <div
        v-if="pinError"
        class="rounded-(--radius-lg) p-(--space-3) mt-(--space-6) text-center bg-(--color-danger-soft)"
      >
        <p class="text-(length:--font-sm) text-(color:--color-danger-muted)">
          {{ pinError }}
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
