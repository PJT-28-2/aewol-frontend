<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import PinKeypad from '@/components/common/PinKeypad.vue';

const router = useRouter();
const store = useAccountStore();

if (!store.linking.verificationId) {
  router.replace({ name: 'AccountLinkSelect' });
}

const pin = ref('');
const pinError = ref('');

// 송금·이체에 쓰이는 비밀번호라 최소한 이 정도(전부 같은 숫자, 완전 연속 숫자)는 막아요.
function isWeakPin(value) {
  if (/^(\d)\1{5}$/.test(value)) return true;
  const ascending = '0123456789';
  const descending = '9876543210';
  return ascending.includes(value) || descending.includes(value);
}

function handleComplete(value) {
  if (isWeakPin(value)) {
    pinError.value = '유추하기 쉬운 숫자예요. 다른 비밀번호를 입력해주세요';
    pin.value = '';
    return;
  }
  store.setPendingPassword(value);
  router.push({ name: 'AccountPasswordConfirm' });
}
</script>

<template>
  <div class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-(--space-5) pt-(--space-4)">
    <header class="mb-(--space-8)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
        간편 비밀번호를 설정해주세요
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
        송금·이체 시 사용할 6자리 비밀번호예요
      </p>
    </header>

    <div
      class="rounded-(--radius-lg) p-(--space-3) mb-(--space-8) text-center"
      :class="pinError ? 'bg-(--color-danger-soft)' : 'bg-(--color-surface)'"
    >
      <p
        class="text-(length:--font-sm)"
        :class="pinError ? 'text-(color:--color-danger-muted)' : 'text-(color:--color-slate-dark)'"
      >
        {{ pinError || '생년월일, 전화번호처럼 유추하기 쉬운 숫자는 피해주세요' }}
      </p>
    </div>

    <PinKeypad v-model="pin" @complete="handleComplete" />
  </div>
</template>
