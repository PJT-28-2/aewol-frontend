<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconRecurring from '@/components/common/icons/IconRecurring.vue';
import { usePaymentStore } from '@/stores/payment';
import { getRecurringCategory } from '@/utils/recurringCategory';

const router = useRouter();
const paymentStore = usePaymentStore();

const isLoading = ref(true);

onMounted(async () => {
  await paymentStore.fetchRecurringPayments();
  isLoading.value = false;
});

function goToRegister() {
  router.push('/payment/recurring/register');
}

function goToCancel(id) {
  router.push(`/payment/recurring/${id}/cancel`);
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <button
        type="button"
        aria-label="뒤로 가기"
        class="inline-flex mb-(--space-3) text-(color:--color-navy)"
        @click="router.back()"
      >
        <IconArrowLeft size="24" />
      </button>
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        정기 결제 관리
      </h1>
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        구독형 결제를 등록하고 확인해요
      </p>
    </header>

    <section class="mb-(--space-6)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-3)"
      >
        등록된 정기결제
      </h2>

      <div
        v-if="isLoading"
        class="py-(--space-8)"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="!paymentStore.recurringPayments.length"
        :icon="IconRecurring"
        message="등록된 정기결제가 없어요"
      />

      <ul
        v-else
        class="flex flex-col gap-(--space-3)"
      >
        <li
          v-for="payment in paymentStore.recurringPayments"
          :key="payment.id"
          class="flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-[14px] p-(--space-4)"
        >
          <span
            class="flex items-center justify-center w-[40px] h-[40px] rounded-(--radius-lg) shrink-0"
            :style="{ backgroundColor: getRecurringCategory(payment.category).bg }"
          >
            <component
              :is="getRecurringCategory(payment.category).icon"
              size="18"
              color="var(--color-navy)"
            />
          </span>
          <div class="flex-1">
            <p
              class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
            >
              {{ payment.merchantName }}
            </p>
            <p
              class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
            >
              매월 {{ payment.dayOfMonth }}일 · {{ payment.amount.toLocaleString() }}원
            </p>
            <p
              class="text-(length:--font-xs) text-(color:--color-slate-dark) mt-(--space-1)"
            >
              {{ payment.nextPaymentLabel }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 px-(--space-3) py-(--space-1) rounded-(--radius-full) bg-(--color-white) border border-(--color-danger-soft) text-(length:--font-sm) text-(color:--color-danger-strong) font-semibold"
            @click="goToCancel(payment.id)"
          >
            해지
          </button>
        </li>
      </ul>
    </section>

    <button
      type="button"
      class="w-full h-[52px] rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-base) font-semibold"
      @click="goToRegister"
    >
      + 정기결제 등록하기
    </button>
  </div>
</template>
