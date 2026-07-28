<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'

// TODO: 화면 디자인 단계 - 1~2단계 입력값 연동/실제 등록 API 연동은 별도 작업에서 구현
const productName = '프리미엄 사료 15kg'
const category = '사료·간식'
const groupPrice = 28000
const originalPrice = 40000
const discountRate = 30
const targetQuantity = 50
const currentQuantity = 0
const deadlineText = '2026년 7월 20일 (D-3)'

const progressPercent = computed(() =>
  Math.min((currentQuantity / targetQuantity) * 100, 100),
)

const router = useRouter()
function goToPrevStep() {
  router.push('/group-purchase/create/step2')
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-4)">
        <button
          type="button"
          class="inline-flex text-(color:--color-navy)"
          @click="goToPrevStep"
        >
          <IconArrowLeft
            size="18"
            color="var(--color-navy)"
          />
        </button>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          3/3
        </p>
      </div>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        최종 확인
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 정보를 확인해주세요
      </p>
    </header>

    <!-- 상품 이미지 미리보기 -->
    <div class="h-[130px] rounded-2xl bg-(--color-surface) flex flex-col items-center justify-center gap-(--space-2) mb-(--space-4)">
      <IconImage
        size="24"
        color="var(--color-slate-muted)"
      />
      <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
        상품 이미지
      </p>
    </div>

    <!-- 상품 요약 -->
    <div class="p-(--space-4) rounded-2xl bg-(--color-white) border border-(--color-border) mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-1)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ productName }}
        </p>
        <span class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold">
          {{ discountRate }}% 할인
        </span>
      </div>
      <p class="text-(length:--font-xs) text-(color:--color-slate-muted) mb-(--space-2)">
        {{ category }}
      </p>
      <div class="flex items-center gap-(--space-2)">
        <p class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
          {{ groupPrice.toLocaleString() }}원
        </p>
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted) line-through">
          {{ originalPrice.toLocaleString() }}원
        </p>
      </div>
    </div>

    <!-- 목표 수량 -->
    <div class="p-(--space-4) rounded-2xl bg-(--color-surface) mb-(--space-4)">
      <p class="text-(length:--font-xs) font-bold text-(color:--color-slate-dark) mb-(--space-1)">
        목표 수량
      </p>
      <p class="text-(length:--font-md) font-bold text-(color:--color-navy) mb-(--space-3)">
        {{ targetQuantity }}개
      </p>
      <div class="h-[6px] rounded-full bg-(--color-border) overflow-hidden">
        <div
          class="h-full rounded-full bg-(--color-gold)"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- 마감일 -->
    <div class="p-(--space-4) rounded-2xl bg-(--color-white) border border-(--color-border) mb-(--space-5)">
      <p class="text-(length:--font-xs) font-bold text-(color:--color-slate-dark) mb-(--space-1)">
        마감일
      </p>
      <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
        {{ deadlineText }}
      </p>
    </div>

    <!-- 안내 문구 -->
    <div class="flex items-start gap-(--space-2) p-(--space-4) rounded-xl bg-(--color-surface) mb-(--space-6)">
      <IconInfo
        size="14"
        color="var(--color-slate-dark)"
      />
      <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
        공동구매는 목표 수량 도달 시 자동으로 결제됩니다. 목표 미달 시 전액 환불됩니다.
      </p>
    </div>

    <!-- 이전 / 글 올리기 (등록 API 연동은 별도 작업) -->
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
        class="flex-1 h-[52px] rounded-2xl bg-(--color-gold) text-(color:--color-navy) text-(length:--font-md) font-bold"
      >
        글 올리기
      </button>
    </div>
  </div>
</template>
