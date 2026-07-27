<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// TODO: 화면 디자인 단계 - 유효성 검사/실제 등록 연동은 별도 작업에서 구현
const targetQuantity = ref('50')
const deadline = ref('2026.07.20')
const deliveryInfo = ref('')
const description = ref('')

const router = useRouter()
function goToPrevStep() {
  router.push('/group-purchase/create')
}
function goToNextStep() {
  router.push('/group-purchase/create/step3')
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-4)">
        <button
          type="button"
          class="text-(length:--font-lg) text-(color:--color-navy) font-bold"
          @click="goToPrevStep"
        >
          ←
        </button>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          2/3
        </p>
      </div>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        구매 조건
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 목표와 마감일을 정해주세요
      </p>
    </header>

    <!-- 목표 수량 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        목표 수량 *
      </label>
      <div class="relative">
        <input
          v-model="targetQuantity"
          type="text"
          inputmode="numeric"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-8) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) font-bold text-(color:--color-navy)"
        >
        <span class="absolute right-(--space-4) top-1/2 -translate-y-1/2 text-(length:--font-sm) text-(color:--color-slate-muted)">
          개
        </span>
      </div>
    </section>

    <!-- 마감일 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        마감일 *
      </label>
      <input
        v-model="deadline"
        type="text"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy)"
      >
    </section>

    <!-- 배송 정보 -->
    <section class="mb-(--space-2)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        배송 정보
      </label>
      <input
        v-model="deliveryInfo"
        type="text"
        placeholder="선택해주세요"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>
    <p class="text-(length:--font-xs) text-(color:--color-slate-muted) mb-(--space-5)">
      배송 방법, 배송비, 예상 배송일
    </p>

    <!-- 추가 설명 -->
    <section class="mb-(--space-6)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        추가 설명
      </label>
      <textarea
        v-model="description"
        rows="4"
        placeholder="상품 상세 설명, 주의사항 등을 입력하세요"
        class="w-full h-[130px] p-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted) resize-none"
      />
    </section>

    <!-- 이전 / 다음 -->
    <div class="flex gap-(--space-3)">
      <button
        type="button"
        class="flex-1 h-[52px] rounded-2xl bg-(--color-white) border-[1.5px] border-(--color-border) text-(length:--font-sm) font-bold text-(color:--color-slate-dark)"
        @click="goToPrevStep"
      >
        이전
      </button>
      <button
        type="button"
        class="flex-1 h-[52px] rounded-2xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold"
        @click="goToNextStep"
      >
        다음
      </button>
    </div>
  </div>
</template>
