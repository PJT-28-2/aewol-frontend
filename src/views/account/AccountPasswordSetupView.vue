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

function handleComplete(value) {
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

    <div class="rounded-(--radius-lg) bg-(--color-surface) p-(--space-3) mb-(--space-8) text-center">
      <p class="text-(length:--font-sm) text-(color:--color-slate-dark)">
        생년월일, 전화번호처럼 유추하기 쉬운 숫자는 피해주세요
      </p>
    </div>

    <PinKeypad v-model="pin" @complete="handleComplete" />
  </div>
</template>
