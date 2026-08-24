<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getPinWeaknessReason } from '@/utils/pin';
import PinKeypad from '@/components/common/PinKeypad.vue';
import PinDots from '@/components/common/PinDots.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const route = useRoute();
const store = useAccountStore();
const nextQuery = route.query.next === '/wallet/charge' ? { next: '/wallet/charge' } : {};

if (!store.linking.verificationId) {
  router.replace({ name: 'AccountLinkSelect', query: nextQuery });
}

const pin = ref('');
const pinError = ref('');

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
  store.setPendingPassword(value);
  router.push({ name: 'AccountPasswordConfirm', query: nextQuery });
}

// 생체인증 등록/전환은 별도 기능이라 아직 실제 동작은 없어요 — 디자인에 맞춰 진입점만
// 두고, 눌렀을 때는 준비 중 안내만 보여줘요.
const showBiometricNotice = ref(false);
function handleBiometricSwitch() {
  showBiometricNotice.value = true;
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
          간편 비밀번호를 설정해주세요
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

      <button
        type="button"
        class="mx-auto mt-(--space-5) flex items-center gap-(--space-2) rounded-full bg-(--color-white) px-(--space-4) py-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
        @click="handleBiometricSwitch"
      >
        <IconLock
          :size="14"
          color="var(--color-leaf-dark)"
        />
        생체인증으로 전환
      </button>
      <p
        v-if="showBiometricNotice"
        class="mt-(--space-2) text-center text-(length:--font-xs) text-(color:--color-navy)"
      >
        생체인증은 준비 중이에요. 조금만 기다려주세요
      </p>
    </div>
  </div>
</template>
