<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import PinKeypad from '@/components/common/PinKeypad.vue';

const router = useRouter();
const store = useAccountStore();

if (!store.linking.password) {
  router.replace({ name: 'AccountLinkSelect' });
}

const pin = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleComplete(value) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const matched = await store.confirmSimplePassword(value);
    if (!matched) {
      errorMessage.value = '비밀번호가 일치하지 않아요. 다시 입력해주세요';
      pin.value = '';
      return;
    }
    router.replace({ name: 'AccountLinkComplete' });
  } catch {
    errorMessage.value = '비밀번호 설정에 실패했어요. 다시 시도해주세요';
    pin.value = '';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-5) pt-(--space-4)">
    <header class="mb-(--space-8)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
        비밀번호를 한번 더 입력해주세요
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
        확인을 위해 다시 한번 입력해주세요
      </p>
    </header>

    <div
      class="rounded-(--radius-lg) p-(--space-3) mb-(--space-8) text-center"
      :class="errorMessage ? 'bg-(--color-danger-soft)' : 'bg-(--color-surface)'"
    >
      <p
        class="text-(length:--font-sm)"
        :class="errorMessage ? 'text-(color:--color-danger-muted)' : 'text-(color:--color-slate-dark)'"
      >
        {{ errorMessage || '방금 설정한 비밀번호와 동일하게 입력해주세요' }}
      </p>
    </div>

    <PinKeypad
      v-model="pin"
      @complete="handleComplete"
    />
  </div>
</template>
