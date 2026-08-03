<script setup>
import { computed, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import { groupPurchaseApi } from '@/api/groupPurchase'
import { USE_MOCK_DATA } from '@/mocks/config'
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase'

// 1~2단계에서 입력한 데이터를 그대로 가져와 확인 화면을 채움
const groupPurchaseCreateStore = useGroupPurchaseCreateStore()
const {
  image,
  productName,
  category,
  unitPrice,
  groupPrice,
  targetQuantity,
  deadline,
  deliveryMethod,
  deliveryFee,
  deliveryEstimateDays,
  description,
} = storeToRefs(groupPurchaseCreateStore)

// 1단계에서 업로드한 사진 미리보기 (없으면 아이콘 placeholder)
// blob URL은 사진이 바뀌거나 화면을 벗어날 때 revoke해서 메모리에 안 쌓이게 함
const photoPreviewUrl = ref('')
watchEffect((onCleanup) => {
  if (!image.value) {
    photoPreviewUrl.value = ''
    return
  }
  const url = URL.createObjectURL(image.value)
  photoPreviewUrl.value = url
  // 사진이 바뀌거나 컴포넌트가 언마운트될 때 자동으로 호출됨
  onCleanup(() => URL.revokeObjectURL(url))
})

function parsePrice(value) {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0
}

// 1단계와 동일한 방식으로 할인율 계산
const discountRate = computed(() => {
  const original = parsePrice(unitPrice.value)
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

const isSubmitting = ref(false)
const submitError = ref('')

async function handleSubmit() {
  if (USE_MOCK_DATA) {
    groupPurchaseCreateStore.reset()
    router.push('/group-purchase/my')
    return
  }

  submitError.value = ''
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('image', image.value)
    formData.append('productName', productName.value)
    formData.append('category', category.value)
    formData.append('unitPrice', parsePrice(unitPrice.value))
    formData.append('groupPrice', parsePrice(groupPrice.value))
    formData.append('targetQuantity', Number(targetQuantity.value))
    formData.append('deadline', deadline.value)
    formData.append('deliveryMethod', deliveryMethod.value)
    formData.append('deliveryFee', parsePrice(deliveryFee.value))
    // TODO: DB의 delivery_date(실제 날짜)는 deadline + deliveryEstimateDays로 백엔드에서 계산한다고 가정. 프론트는 일수만 전달
    formData.append('deliveryEstimateDays', Number(deliveryEstimateDays.value))
    formData.append('description', description.value)

    await groupPurchaseApi.create(formData) // POST /group-purchase/create
    groupPurchaseCreateStore.reset()
    router.push('/group-purchase/my')
  } catch {
    submitError.value = '등록에 실패했어요. 다시 시도해주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-end mb-(--space-4)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          3/3
        </p>
      </div>
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        최종 확인
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted)">
        공동구매 정보를 확인해주세요
      </p>
    </header>

    <!-- 상품 이미지 미리보기 -->
    <div class="h-[130px] rounded-(--radius-xl) bg-(--color-surface) flex flex-col items-center justify-center gap-(--space-2) mb-(--space-4) overflow-hidden">
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
    <div class="p-(--space-4) rounded-(--radius-xl) bg-(--color-white) border border-(--color-border) mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-1)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ productName }}
        </p>
        <span
          v-if="discountRate > 0"
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-gold-surface) text-(color:--color-gold-dark) text-(length:--font-xs) font-bold"
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
          {{ parsePrice(unitPrice).toLocaleString() }}원
        </p>
      </div>
    </div>

    <!-- 목표 수량 -->
    <div class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-4)">
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
    <div class="p-(--space-4) rounded-(--radius-xl) bg-(--color-white) border border-(--color-border) mb-(--space-5)">
      <p class="text-(length:--font-xs) font-bold text-(color:--color-slate-dark) mb-(--space-1)">
        마감일
      </p>
      <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
        {{ deadlineDisplayText }}
      </p>
    </div>

    <!-- 배송 정보 -->
    <div class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-5)">
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
    <div class="flex items-start gap-(--space-2) p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-6)">
      <IconInfo
        size="14"
        color="var(--color-slate-dark)"
      />
      <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
        공동구매는 목표 인원 도달 시 자동으로 결제됩니다. 목표 미달 시 전액 환불됩니다.
      </p>
    </div>

    <p
      v-if="submitError"
      class="text-(length:--font-xs) text-(color:--color-danger-strong) text-center mb-(--space-3)"
    >
      {{ submitError }}
    </p>

    <!-- 이전 / 글 올리기 -->
    <div class="flex gap-(--space-3)">
      <AppButton
        variant="secondary"
        size="lg"
        class="flex-1"
        :disabled="isSubmitting"
        @click="goToPrevStep"
      >
        이전
      </AppButton>
      <AppButton
        variant="primary"
        size="lg"
        class="flex-1"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        글 올리기
      </AppButton>
    </div>
  </div>
</template>
