<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchaseCreate'

// 1~2단계에서 입력한 데이터를 그대로 가져와 확인 화면을 채움
const groupPurchaseCreateStore = useGroupPurchaseCreateStore()
const {
  photos,
  productName,
  category,
  originalPrice,
  groupPrice,
  targetQuantity,
  deadline,
  deliveryMethod,
  deliveryFee,
  deliveryEstimateDays,
} = storeToRefs(groupPurchaseCreateStore)

// 1단계에서 업로드한 첫 번째 사진 미리보기 (없으면 아이콘 placeholder)
const photoPreviewUrl = computed(() =>
  photos.value.length > 0 ? URL.createObjectURL(photos.value[0]) : '',
)

function parsePrice(value) {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0
}

// 1단계와 동일한 방식으로 할인율 계산
const discountRate = computed(() => {
  const original = parsePrice(originalPrice.value)
  const group = parsePrice(groupPrice.value)
  if (!original || !group || group >= original) return 0
  return Math.round((1 - group / original) * 100)
})

const deliveryFeeText = computed(() => {
  const fee = parsePrice(deliveryFee.value)
  return fee > 0 ? `${fee.toLocaleString()}원` : '무료배송'
})

// 'YYYY-MM-DD' -> "2026년 7월 31일 (D-3)"
const deadlineDisplayText = computed(() => {
  if (!deadline.value) return ''
  const [year, month, day] = deadline.value.split('-').map(Number)
  const deadlineDate = new Date(year, month - 1, day)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((deadlineDate - todayStart) / 86400000)
  return `${year}년 ${month}월 ${day}일 (D-${diffDays})`
})

// 신규 등록 게시글이라 참여 진행률은 0%에서 시작
const progressPercent = 0

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
    <div class="h-[130px] rounded-2xl bg-(--color-surface) flex flex-col items-center justify-center gap-(--space-2) mb-(--space-4) overflow-hidden">
      <img
        v-if="photoPreviewUrl"
        :src="photoPreviewUrl"
        alt=""
        class="w-full h-full object-cover"
      >
      <template v-else>
        <IconImage
          size="24"
          color="var(--color-slate-muted)"
        />
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          상품 이미지
        </p>
      </template>
    </div>

    <!-- 상품 요약 -->
    <div class="p-(--space-4) rounded-2xl bg-(--color-white) border border-(--color-border) mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-1)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ productName }}
        </p>
        <span
          v-if="discountRate > 0"
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
        >
          {{ discountRate }}% 할인
        </span>
      </div>
      <p class="text-(length:--font-xs) text-(color:--color-slate-muted) mb-(--space-2)">
        {{ category }}
      </p>
      <div class="flex items-center gap-(--space-2)">
        <p class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
          {{ parsePrice(groupPrice).toLocaleString() }}원
        </p>
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted) line-through">
          {{ parsePrice(originalPrice).toLocaleString() }}원
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
        {{ deadlineDisplayText }}
      </p>
    </div>

    <!-- 배송 정보 -->
    <div class="p-(--space-4) rounded-2xl bg-(--color-surface) mb-(--space-5)">
      <p class="text-(length:--font-xs) font-bold text-(color:--color-slate-dark) mb-(--space-3)">
        배송 정보
      </p>
      <div class="flex items-center justify-between mb-(--space-2)">
        <p class="text-(length:--font-xs) text-(color:--color-slate-dark)">
          배송 방법
        </p>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ deliveryMethod }}
        </p>
      </div>
      <div class="flex items-center justify-between mb-(--space-2)">
        <p class="text-(length:--font-xs) text-(color:--color-slate-dark)">
          배송비
        </p>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ deliveryFeeText }}
        </p>
      </div>
      <div class="flex items-center justify-between">
        <p class="text-(length:--font-xs) text-(color:--color-slate-dark)">
          배송 예정일
        </p>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          마감일로부터 {{ deliveryEstimateDays }}일 이내
        </p>
      </div>
    </div>

    <!-- 안내 문구 -->
    <div class="flex items-start gap-(--space-2) p-(--space-4) rounded-xl bg-(--color-surface) mb-(--space-6)">
      <IconInfo
        size="14"
        color="var(--color-slate-dark)"
      />
      <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
        공동구매는 목표 인원 도달 시 자동으로 결제됩니다. 목표 미달 시 전액 환불됩니다.
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
