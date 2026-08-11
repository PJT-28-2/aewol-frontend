<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconRecurring from '@/components/common/icons/IconRecurring.vue';
import { usePaymentStore } from '@/stores/payment';
import { usePetStore } from '@/stores/pet';
import { getRecurringCategory } from '@/utils/recurringCategory';

const router = useRouter();
const paymentStore = usePaymentStore();
const petStore = usePetStore();

const isLoading = ref(true);
const loadError = ref(false);

onMounted(async () => {
  try {
    // 정기결제에 지정된 반려동물 이름을 보여주려면 반려동물 목록도 함께 필요하다.
    await Promise.all([
      paymentStore.fetchRecurringPayments(),
      petStore.fetchPets(),
    ]);
  } catch {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
});

// petId가 지정된 정기결제만 이름을 노출한다. 목록에 없는 pet(삭제 등)은 표시하지 않는다.
function petNameOf(payment) {
  if (!payment.petId) return '';
  return petStore.pets.find((pet) => pet.id === payment.petId)?.name ?? '';
}

function goToRegister() {
  router.push('/payment/recurring/register');
}

function goToDetail(id) {
  router.push(`/payment/recurring/${id}`);
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        정기 결제 관리
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
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
        v-else-if="loadError"
        :icon="IconRecurring"
        message="정기결제를 불러오지 못했어요. 잠시 후 다시 시도해주세요"
      />

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
          class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)"
        >
          <button
            type="button"
            class="w-full flex items-center gap-(--space-3) p-(--space-4) text-left"
            @click="goToDetail(payment.id)"
          >
            <FeatureIconTile
              :icon="getRecurringCategory(payment.category).icon"
              :tone="getRecurringCategory(payment.category).tone"
            />
            <div class="flex-1">
              <div class="flex items-center gap-(--space-2)">
                <p
                  class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
                >
                  {{ payment.merchantName }}
                </p>
                <span
                  v-if="petNameOf(payment)"
                  class="shrink-0 rounded-(--radius-full) bg-(--color-leaf-soft) px-(--space-2) py-[2px] text-(length:--font-xs) font-medium text-(color:--color-navy)"
                >
                  {{ petNameOf(payment) }}
                </span>
              </div>
              <p
                class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
              >
                매월 {{ payment.dayOfMonth }}일 · {{ payment.amount.toLocaleString() }}원
              </p>
            </div>
            <IconChevronRight
              :size="18"
              color="var(--color-slate-muted)"
              class="shrink-0"
            />
          </button>
        </li>
      </ul>
    </section>

    <button
      type="button"
      class="h-[52px] w-full rounded-(--radius-xl) bg-(--color-leaf) text-(length:--font-base) font-semibold text-(color:--color-navy)"
      @click="goToRegister"
    >
      + 정기결제 등록하기
    </button>
  </div>
</template>
