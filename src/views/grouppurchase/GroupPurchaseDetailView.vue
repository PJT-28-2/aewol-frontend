<script setup>
import { computed, ref } from 'vue'
import productImage from '@/assets/images/grouppurchase/mock-product-dogfood.png'

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체 (상세 데이터 연동은 별도 작업에서 진행)
const groupPurchase = ref({
  productName: '프리미엄 사료 15kg',
  image: productImage,
  groupPrice: 28000,
  unitPrice: 40000,
  currentQuantity: 32,
  targetQuantity: 50,
  deadlineLabel: 'D-3',
})

const quantity = ref(1)

function decreaseQuantity() {
  if (quantity.value > 1) quantity.value -= 1
}

function increaseQuantity() {
  quantity.value += 1
}

const discountRate = computed(() =>
  Math.round(
    (1 - groupPurchase.value.groupPrice / groupPurchase.value.unitPrice) * 100,
  ),
)

const displayedCurrentQuantity = computed(
  () => groupPurchase.value.currentQuantity + quantity.value,
)

const remainingForConfirm = computed(() =>
  Math.max(
    groupPurchase.value.targetQuantity - displayedCurrentQuantity.value,
    0,
  ),
)

const progressPercent = computed(() =>
  Math.min(
    (displayedCurrentQuantity.value / groupPurchase.value.targetQuantity) * 100,
    100,
  ),
)

const totalPrice = computed(
  () => groupPurchase.value.groupPrice * quantity.value,
)
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <router-link
        to="/group-purchase"
        class="inline-block mb-(--space-3) text-(length:--font-lg) text-(color:--color-navy) no-underline font-bold"
      >
        ←
      </router-link>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
        공동구매 참여
      </h1>
    </header>

    <!-- 상품 정보 -->
    <section class="flex flex-col items-start mb-(--space-6)">
      <div class="w-[110px] h-[110px] rounded-2xl bg-(--color-surface) overflow-hidden mb-(--space-4)">
        <img
          :src="groupPurchase.image"
          alt=""
          class="w-full h-full object-cover"
        >
      </div>
      <h2 class="text-(length:--font-md) font-bold text-(color:--color-navy) mb-(--space-2)">
        {{ groupPurchase.productName }}
      </h2>
      <div class="flex items-center gap-(--space-2)">
        <p class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
          {{ groupPurchase.groupPrice.toLocaleString() }}원
        </p>
        <p class="text-(length:--font-sm) text-(color:--color-slate-muted) line-through">
          {{ groupPurchase.unitPrice.toLocaleString() }}원
        </p>
        <span
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
        >
          {{ discountRate }}% 할인
        </span>
      </div>
    </section>

    <!-- 참여 현황 -->
    <section class="p-(--space-4) rounded-2xl bg-(--color-surface) mb-(--space-6)">
      <div class="flex items-center justify-between mb-(--space-3)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          현재 수량
        </p>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ displayedCurrentQuantity }}/{{ groupPurchase.targetQuantity }}개
        </p>
      </div>
      <div class="h-[8px] rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)">
        <div
          class="h-full rounded-full bg-(--color-gold)"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="flex items-center justify-between">
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          마감까지 {{ groupPurchase.deadlineLabel }}
        </p>
        <p class="text-(length:--font-xs) font-bold text-(color:--color-discount-text)">
          {{ remainingForConfirm }}개 더 모이면 확정
        </p>
      </div>
    </section>

    <!-- 수량 선택 -->
    <section class="mb-(--space-6)">
      <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-3)">
        수량 선택
      </p>
      <div
        class="flex items-center justify-between h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border)"
      >
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ quantity }}개
        </p>
        <div class="flex items-center gap-(--space-3)">
          <button
            type="button"
            class="size-[34px] rounded-lg bg-(--color-white) border border-(--color-border) text-(length:--font-md) font-bold text-(color:--color-slate-dark) disabled:opacity-40"
            :disabled="quantity <= 1"
            @click="decreaseQuantity"
          >
            −
          </button>
          <p class="w-[24px] text-center text-(length:--font-sm) font-bold text-(color:--color-navy)">
            {{ quantity }}
          </p>
          <button
            type="button"
            class="size-[34px] rounded-lg bg-(--color-white) border border-(--color-border) text-(length:--font-md) font-bold text-(color:--color-slate-dark)"
            @click="increaseQuantity"
          >
            +
          </button>
        </div>
      </div>
    </section>

    <!-- 결제 버튼 -->
    <div class="fixed bottom-(--bottom-nav-height) inset-x-0 p-(--space-4) bg-(--color-white)">
      <button
        type="button"
        class="w-full h-[52px] rounded-2xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold"
      >
        {{ totalPrice.toLocaleString() }}원 결제하기
      </button>
    </div>
  </div>
</template>
