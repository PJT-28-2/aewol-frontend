<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import { usePaymentStore } from '@/stores/payment';
import { usePetStore } from '@/stores/pet';
import { getRecurringCategory } from '@/utils/recurringCategory';

const route = useRoute();
const router = useRouter();
const paymentStore = usePaymentStore();
const petStore = usePetStore();

const isLoading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([
      paymentStore.fetchRecurringPayments(),
      petStore.fetchPets(),
    ]);
  } catch {
    // 조회 실패 시 payment가 null이 되어 "찾을 수 없어요" 안내가 노출된다.
  } finally {
    isLoading.value = false;
  }
});

const payment = computed(() => paymentStore.findRecurringPayment(route.params.id));

const category = computed(() => getRecurringCategory(payment.value?.category));

const petName = computed(() => {
  if (!payment.value?.petId) return '';
  return petStore.pets.find((pet) => pet.id === payment.value.petId)?.name ?? '';
});

// "2026-08-15" -> "2026.08.15". 값이 없으면 표기하지 않는다.
const nextPaymentDateText = computed(() =>
  payment.value?.nextPaymentDate ? payment.value.nextPaymentDate.replaceAll('-', '.') : '',
);

function goToCancel() {
  router.push(`/payment/recurring/${route.params.id}/cancel`);
}

function goToEdit() {
  router.push(`/payment/recurring/${route.params.id}/edit`);
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <LoadingSpinner v-if="isLoading" />

    <template v-else-if="!payment">
      <h1
        class="mt-(--space-6) text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        정기결제 정보를 찾을 수 없어요
      </h1>
      <p
        class="mt-(--space-2) mb-(--space-8) text-(length:--font-md) text-(color:--color-slate-muted)"
      >
        정기결제 관리 화면에서 다시 확인해주세요
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
      <header class="mb-(--space-5)">
        <h1
          class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
        >
          정기결제 상세
        </h1>
        <p
          class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          등록한 정기결제 정보를 확인하고 관리해요
        </p>
      </header>

      <div class="mb-(--space-5) flex items-center gap-(--space-3)">
        <FeatureIconTile
          :icon="category.icon"
          :tone="category.tone"
        />
        <div>
          <h2
            class="text-(length:--font-xl) font-bold text-(color:--color-navy)"
          >
            {{ payment.merchantName }}
          </h2>
          <span
            class="mt-(--space-1) inline-block rounded-(--radius-full) bg-(--color-leaf-soft) px-(--space-2) py-[2px] text-(length:--font-xs) font-semibold text-(color:--color-navy)"
          >
            {{ category.label }}
          </span>
        </div>
      </div>

      <dl
        class="flex flex-col gap-(--space-4) rounded-(--radius-2xl) bg-(--color-white) p-(--space-5)"
      >
        <div class="flex items-start justify-between gap-(--space-4)">
          <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
            결제금액
          </dt>
          <dd
            class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            {{ payment.amount.toLocaleString() }}원
          </dd>
        </div>

        <div class="flex items-start justify-between gap-(--space-4)">
          <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
            결제주기
          </dt>
          <dd
            class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            매월 {{ payment.dayOfMonth }}일
          </dd>
        </div>

        <div
          v-if="nextPaymentDateText"
          class="flex items-start justify-between gap-(--space-4)"
        >
          <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
            다음 결제일
          </dt>
          <dd
            class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            {{ nextPaymentDateText }}
          </dd>
        </div>

        <div
          v-if="petName"
          class="flex items-start justify-between gap-(--space-4)"
        >
          <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
            반려동물
          </dt>
          <dd
            class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            {{ petName }}
          </dd>
        </div>

        <div class="flex items-start justify-between gap-(--space-4)">
          <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
            결제수단
          </dt>
          <dd
            class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            애월지갑
          </dd>
        </div>
      </dl>

      <div class="mt-(--space-5) flex gap-(--space-3)">
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1 bg-(--color-white)!"
          @click="goToCancel"
        >
          해지
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          class="flex-1"
          @click="goToEdit"
        >
          변경
        </AppButton>
      </div>
    </template>
  </div>
</template>
