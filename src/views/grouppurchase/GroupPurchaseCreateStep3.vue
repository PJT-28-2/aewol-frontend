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
import { formatDDayLabel } from '@/utils/date'
import { useMidnightTick } from '@/composables/useMidnightTick'

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

// 'YYYY-MM-DD' -> "2026년 7월 31일 (D-3)". 선택한 날짜가 지난 뒤 다시 이 화면에 들어오는
// 경우(작성 중 방치 등)에도 D-0/D--1 같은 값 대신 "마감"으로 보이도록 formatDDayLabel을 사용한다.
// 실제 제출 차단은 store의 isStep2Complete(handleSubmit에서 재검사)가 담당.
// deadline.value가 바뀔 때만 재계산되던 것을 midnightTick으로 자정 경계에서도 갱신되도록 함
// (GroupPurchaseDetailView.vue/GroupPurchaseMyView.vue와 동일한 갱신 계약)
const midnightTick = useMidnightTick()
const deadlineDisplayText = computed(() => {
  if (!deadline.value) return ''
  const [year, month, day] = deadline.value.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일 (${formatDDayLabel(deadline.value, new Date(midnightTick.value))})`
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
  // 라우터 가드가 진입 시점엔 필수 값을 확인하지만, 그 이후 이미지를 삭제하는 등으로 스토어가
  // 다시 비워질 수 있어(FormData.append(null)은 문자열 "null"로 전송돼 서버에 손상된 파일이 감) 제출 직전에도 재검사
  if (!groupPurchaseCreateStore.isStep1Complete) {
    router.push('/group-purchase/create/step1')
    return
  }
  if (!groupPurchaseCreateStore.isStep2Complete()) {
    router.push('/group-purchase/create/step2')
    return
  }

  if (USE_MOCK_DATA) {
    groupPurchaseCreateStore.reset()
    router.push('/group-purchase/my')
    return
  }

  submitError.value = ''
  isSubmitting.value = true
  try {
    // 1) 사진을 먼저 업로드해서 URL을 받고 2) 그 URL을 JSON 생성 요청의 image 필드에 실어 보낸다
    const imageFormData = new FormData()
    imageFormData.append('image', image.value)
    const { data: uploadData } = await groupPurchaseApi.uploadImage(imageFormData)
    const imageUrl = uploadData.result.imageUrl

    // 백엔드(GroupPurchaseCreateRequest)가 JSON으로 받으며 필드는 camelCase, deadline은
    // LocalDateTime(@Future)이라 날짜만 보내면 파싱에 실패함 — 앱 전역에서 날짜만 있는
    // deadline은 23:59:59를 마감 시각으로 취급하므로(getDeadlineTimestamp) 그 규칙을 그대로 붙인다
    const payload = {
      image: imageUrl,
      productName: productName.value,
      category: category.value,
      unitPrice: parsePrice(unitPrice.value),
      groupPrice: parsePrice(groupPrice.value),
      targetQuantity: Number(targetQuantity.value),
      deadline: `${deadline.value}T23:59:59`,
      deliveryMethod: deliveryMethod.value,
      deliveryFee: parsePrice(deliveryFee.value),
      // TODO(backend): 배송 예정일을 "목표 수량 달성일 + 예상 일수"로 계산하기로 했으나,
      // 현재 백엔드에는 이 계산에 필요한 달성 시각 기록(confirmed_at 등)과
      // deliveryEstimateDays 요청 필드 자체가 없어(GroupPurchaseCreateRequest.deliveryDate만 존재)
      // 이 값은 아직 백엔드에 전달되지 않는다. 백엔드 변경 후 deliveryDate 필드로 교체할 것
      deliveryEstimateDays: Number(deliveryEstimateDays.value),
      description: description.value,
    }

    await groupPurchaseApi.create(payload)
    groupPurchaseCreateStore.reset()
    router.push('/group-purchase/my')
  } catch (err) {
    // 403(관리자 아님)은 Spring Security 기본 응답이라 바디가 비어있어 별도 문구로 처리하고,
    // 그 외 실패는 백엔드가 ApiResponse로 내려주는 실제 사유(이미지 확장자 등)를 그대로 보여준다
    if (err.response?.status === 403) {
      submitError.value = '관리자만 등록할 수 있어요.'
    } else {
      submitError.value = err.response?.data?.message ?? '등록에 실패했어요. 다시 시도해주세요.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-(--space-8)">
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
    <div class="mb-(--space-4) flex h-[130px] flex-col items-center justify-center gap-(--space-2) overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)">
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
    <div class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
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
    <div class="mb-(--space-4) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
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
    <div class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
      <p class="text-(length:--font-xs) font-bold text-(color:--color-slate-dark) mb-(--space-1)">
        마감일
      </p>
      <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
        {{ deadlineDisplayText }}
      </p>
    </div>

    <!-- 배송 정보 -->
    <div class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
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
    <div class="mb-(--space-6) flex items-start gap-(--space-2) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4)">
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
        variant="neutral"
        size="lg"
        class="flex-1 bg-(--color-white)!"
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
