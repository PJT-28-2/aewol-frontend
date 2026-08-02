<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import petSuccess from '@/assets/images/pet-success.png';

const route = useRoute();
const router = useRouter();

const dayOfMonth = computed(() => route.query.dayOfMonth || '');
const amount = computed(() => Number(route.query.amount) || 0);

function confirmComplete() {
  router.replace('/payment/recurring');
}
</script>

<template>
  <div
    class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-(--space-6) pt-(--space-4) flex flex-col items-center text-center"
  >
    <img
      :src="petSuccess"
      alt=""
      class="w-32 h-auto mb-(--space-4)"
    />
    <h1
      class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
    >
      정기결제가 등록됐어요
    </h1>
    <p
      class="text-(length:--font-md) text-(color:--color-slate-muted) mb-(--space-8)"
    >
      매월 {{ dayOfMonth }}일에 {{ amount.toLocaleString() }}원이
      자동으로 결제돼요
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
