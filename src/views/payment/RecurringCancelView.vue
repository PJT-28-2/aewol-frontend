<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusVisual from '@/components/common/StatusVisual.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import { usePaymentStore } from '@/stores/payment';
import { getRecurringCategory } from '@/utils/recurringCategory';

const route = useRoute();
const router = useRouter();
const paymentStore = usePaymentStore();

const isLoading = ref(true);
const isCanceling = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  try {
    await paymentStore.fetchRecurringPayments();
  } catch {
    // 조회 실패 시 payment가 null이 되어 "찾을 수 없어요" 안내가 노출된다.
  } finally {
    isLoading.value = false;
  }
});

const payment = computed(() => paymentStore.findRecurringPayment(route.params.id));

async function handleCancel() {
  if (!payment.value || isCanceling.value) return;
  // cancelRecurringPayment이 store에서 항목을 제거하면 payment computed가 즉시 null로
  // 바뀌므로, 취소 요청 전에 필요한 값을 미리 지역 변수로 캡처해둔다.
  const { id, merchantName } = payment.value;
  isCanceling.value = true;
  errorMessage.value = '';
  try {
    await paymentStore.cancelRecurringPayment(id);
    router.replace({
      path: '/payment/recurring/cancel/complete',
      query: { merchantName },
    });
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ?? '정기결제 해지에 실패했어요. 잠시 후 다시 시도해주세요';
  } finally {
    isCanceling.value = false;
  }
}
</script>

<template>
  <div
    class="mx-auto flex min-h-screen max-w-(--content-max-width) flex-col items-center bg-(--color-app-bg) px-(--space-6) pt-[calc(var(--header-height)+var(--space-4))] text-center"
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
        variant="primary"
        size="lg"
        block
        @click="router.replace('/payment/recurring')"
      >
        정기결제 관리로 이동
      </AppButton>
    </template>

    <template v-else>
      <StatusVisual
        variant="danger"
        class="mb-(--space-4)"
      />
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
        class="mb-(--space-8) flex w-full items-center gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <FeatureIconTile
          :icon="getRecurringCategory(payment.category).icon"
          :tone="getRecurringCategory(payment.category).tone"
        />
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

      <p
        v-if="errorMessage"
        class="mb-(--space-3) text-(length:--font-sm) text-(color:--color-danger-strong)"
      >
        {{ errorMessage }}
      </p>

      <div class="w-full flex gap-(--space-3)">
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1 bg-(--color-white)!"
          :disabled="isCanceling"
          @click="router.back()"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          size="lg"
          class="flex-1"
          :disabled="isCanceling"
          @click="handleCancel"
        >
          해지하기
        </AppButton>
      </div>
    </template>
  </div>
</template>
