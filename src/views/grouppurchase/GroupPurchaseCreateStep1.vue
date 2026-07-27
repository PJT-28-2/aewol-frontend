<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import IconImage from '@/components/common/icons/IconImage.vue'

// TODO: 화면 디자인 단계 - 유효성 검사/실제 등록 연동은 별도 작업에서 구현
const productName = ref('')
const category = ref('')
const originalPrice = ref('')
const groupPrice = ref('28,000')
const discountRate = 30

const router = useRouter()
function goToNextStep() {
  router.push('/group-purchase/create/step2')
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-4)">
        <router-link
          to="/group-purchase"
          class="text-(length:--font-lg) text-(color:--color-navy) no-underline font-bold"
        >
          ←
        </router-link>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          1/3
        </p>
      </div>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        상품 정보
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        판매할 상품 정보를 입력해주세요
      </p>
    </header>

    <!-- 사진 업로드 (선택 항목) -->
    <section class="mb-(--space-6)">
      <div class="flex items-center gap-(--space-2) mb-(--space-3)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          사진 직접 업로드
        </p>
        <span
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
        >
          선택
        </span>
      </div>
      <button
        type="button"
        class="w-full h-[90px] rounded-2xl bg-(--color-white) border-[1.2px] border-(--color-slate-muted) flex flex-col items-center justify-center gap-(--space-1)"
      >
        <IconImage
          size="20"
          color="var(--color-slate-dark)"
        />
        <span class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          사진 추가
        </span>
        <span class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          최대 5장
        </span>
      </button>
    </section>

    <!-- 상품명 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        상품명 *
      </label>
      <input
        v-model="productName"
        type="text"
        placeholder="예: 프리미엄 사료 15kg"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 카테고리 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        카테고리 *
      </label>
      <input
        v-model="category"
        type="text"
        placeholder="사료·간식"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 정가 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        정가 *
      </label>
      <input
        v-model="originalPrice"
        type="text"
        inputmode="numeric"
        placeholder="40,000 원"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 공동구매 가격 -->
    <section class="mb-(--space-6)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        공동구매 가격 *
      </label>
      <div class="relative">
        <input
          v-model="groupPrice"
          type="text"
          inputmode="numeric"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-9) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) font-bold text-(color:--color-navy)"
        >
        <span
          class="absolute right-(--space-4) top-1/2 -translate-y-1/2 px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
        >
          {{ discountRate }}% 할인
        </span>
      </div>
    </section>

    <!-- 다음: 2단계(구매 조건)로 이동 -->
    <button
      type="button"
      class="w-full h-[52px] rounded-2xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold"
      @click="goToNextStep"
    >
      다음
    </button>
  </div>
</template>
