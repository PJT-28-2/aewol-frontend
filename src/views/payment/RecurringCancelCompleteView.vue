<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import petCancelWarning from '@/assets/images/pet-cancel-warning.png';

const route = useRoute();
const router = useRouter();

const merchantName = computed(
  () => route.query.merchantName || '정기결제',
);

function confirmComplete() {
  router.replace('/payment/recurring');
}
</script>

<template>
  <div
    class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-(--space-6) pt-[calc(var(--header-height)+var(--space-4))] flex flex-col items-center text-center"
  >
    <img
      :src="petCancelWarning"
      alt=""
      class="w-32 h-auto mb-(--space-4)"
    />
    <h1
      class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
    >
      정기결제가 해지됐어요
    </h1>
    <p
      class="text-(length:--font-md) text-(color:--color-slate-muted) mb-(--space-8)"
    >
      {{ merchantName }} 결제가 더 이상 진행되지 않아요
    </p>

    <AppButton
      variant="primary"
      size="lg"
      block
      @click="confirmComplete"
    >
      확인
    </AppButton>
  </div>
</template>
