<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import petDeleteWarning from '@/assets/images/pet-delete-warning.png';
import { usePaymentStore } from '@/stores/payment';
import { getRecurringCategory } from '@/utils/recurringCategory';

const route = useRoute();
const router = useRouter();
const paymentStore = usePaymentStore();

const isLoading = ref(true);

onMounted(async () => {
  await paymentStore.fetchRecurringPayments();
  isLoading.value = false;
});

const payment = computed(() => paymentStore.findRecurringPayment(route.params.id));

async function handleCancel() {
  if (!payment.value) return;
  // cancelRecurringPayment이 store에서 항목을 제거하면 payment computed가 즉시 null로
  // 바뀌므로, 취소 요청 전에 필요한 값을 미리 지역 변수로 캡처해둔다.
  const { id, merchantName } = payment.value;
  await paymentStore.cancelRecurringPayment(id);
  router.replace({
    path: '/payment/recurring/cancel/complete',
    query: { merchantName },
  });
}
</script>

<template>
  <div
    class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-(--space-6) pt-[calc(var(--header-height)+var(--space-4))] flex flex-col items-center text-center"
  >
    <LoadingSpinner v-if="isLoading" />

    <template v-else-if="!payment">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        정기결제 정보를 찾을 수 없어요
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)"
      >
        정기결제 관리 화면에서 다시 시도해주세요
      </p>
      <AppButton
        variant="navy"
        size="lg"
        block
        @click="router.replace('/payment/recurring')"
      >
        정기결제 관리로 이동
      </AppButton>
    </template>

    <template v-else>
      <img
        :src="petDeleteWarning"
        alt=""
        class="w-[139px] h-[139px] mb-(--space-4)"
      >
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        정기결제를 해지할까요?
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mb-(--space-8)"
      >
        해지 후에도 다음 결제일 전까지는 다시 등록할 수 있어요
      </p>

      <div
        class="w-full flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-xl) p-(--space-4) mb-(--space-8)"
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
        <div class="flex-1 text-left">
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
        </div>
      </div>

      <div class="w-full flex gap-(--space-3)">
        <AppButton
          variant="secondary"
          size="lg"
          class="flex-1 border-(--color-border)!"
          @click="router.back()"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          size="lg"
          class="flex-1"
          @click="handleCancel"
        >
          해지하기
        </AppButton>
      </div>
    </template>
  </div>
</template>
