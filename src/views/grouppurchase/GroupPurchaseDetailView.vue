<script setup>
import { computed, ref } from 'vue'
import productImage from '@/assets/images/grouppurchase/mock-product-dogfood.png'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체 (상세 데이터 연동은 별도 작업에서 진행)
// 필드명은 group_purchase 테이블 컬럼(gp_id, delivery_method, delivery_fee, delivery_date, deadline 등) 기준
const groupPurchase = ref({
  productName: '프리미엄 사료 15kg',
  image: productImage,
  groupPrice: 28000,
  unitPrice: 40000,
  currentQuantity: 32,
  targetQuantity: 50,
  deadline: '2026-08-01',
  deliveryMethod: '공동구매 마감 후 3일 이내 발송',
  deliveryFee: 0,
  deliveryDate: '2026-08-04',
})

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 'YYYY-MM-DD' 문자열을 UTC 파싱으로 인한 날짜 밀림 없이 로컬 자정 Date로 변환
function toLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const quantity = ref(1)

function decreaseQuantity() {
  if (quantity.value > 1) quantity.value -= 1 // 최소 수량 1개 미만으로는 내려가지 않도록 제한
}

function increaseQuantity() {
  const nextQuantity = quantity.value + 1
  if (groupPurchase.value.currentQuantity + nextQuantity > groupPurchase.value.targetQuantity) {
    alert('목표 수량을 초과하여 더 이상 선택할 수 없습니다.') // 목표 수량 초과 선택 차단
    return
  }
  quantity.value = nextQuantity
}

// 정가 대비 공동구매가 할인율을 직접 저장하지 않고 계산으로 도출
const discountRate = computed(() =>
  Math.round(
    (1 - groupPurchase.value.groupPrice / groupPurchase.value.unitPrice) * 100,
  ),
)

// 내가 선택한 수량을 반영했을 때의 참여 현황(미리보기)
const displayedCurrentQuantity = computed(
  () => groupPurchase.value.currentQuantity + quantity.value,
)

// 목표 수량까지 남은 개수 (음수 방지)
const remainingForConfirm = computed(() =>
  Math.max(
    groupPurchase.value.targetQuantity - displayedCurrentQuantity.value,
    0,
  ),
)

// 진행률 바 너비(%) 계산, 100% 초과 방지
const progressPercent = computed(() =>
  Math.min(
    (displayedCurrentQuantity.value / groupPurchase.value.targetQuantity) * 100,
    100,
  ),
)

// 선택 수량에 따라 실시간으로 바뀌는 결제 금액
const totalPrice = computed(
  () => groupPurchase.value.groupPrice * quantity.value,
)

// raw deadline 값에서 남은 일수를 D-day 라벨로 변환
const deadlineLabel = computed(() => {
  const diffDays = Math.ceil(
    (toLocalDate(groupPurchase.value.deadline) - startOfToday()) / (1000 * 60 * 60 * 24),
  )
  return `D-${Math.max(diffDays, 0)}`
})

// delivery_fee가 0원이면 무료로 표시
const deliveryFeeLabel = computed(() =>
  groupPurchase.value.deliveryFee === 0
    ? '무료'
    : `${groupPurchase.value.deliveryFee.toLocaleString()}원`,
)

// delivery_method와 배송비 유무를 합친 안내 문구
const shippingSummaryLabel = computed(() => {
  const feeSuffix = groupPurchase.value.deliveryFee === 0 ? '무료배송' : '유료배송'
  return `${groupPurchase.value.deliveryMethod} · ${feeSuffix}`
})

// raw delivery_date를 'M/D(요일) 도착 보장' 형식으로 변환
const arrivalDateLabel = computed(() => {
  const date = toLocalDate(groupPurchase.value.deliveryDate)
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]}) 도착 보장`
})
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <router-link
        to="/group-purchase"
        aria-label="뒤로 가기"
        class="inline-flex items-center mb-(--space-3) text-(color:--color-navy)"
      >
        <IconArrowLeft :size="24" color="currentColor" />
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
        <!-- 할인율은 저장된 값이 아니라 discountRate computed로 계산된 값 -->
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
        <!-- 내가 선택한 수량이 더해진 현재 수량(미리보기) -->
        <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ displayedCurrentQuantity }}/{{ groupPurchase.targetQuantity }}개
        </p>
      </div>
      <!-- 진행률 바도 선택 수량 반영 기준으로 실시간 갱신 -->
      <div class="h-[8px] rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)">
        <div
          class="h-full rounded-full bg-(--color-gold)"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="flex items-center justify-between">
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          마감까지 {{ deadlineLabel }}
        </p>
        <!-- 목표까지 남은 수량도 선택 수량 반영 기준으로 갱신 -->
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
        <!-- 수량 스테퍼: -는 1개에서 비활성화, +는 목표 초과 시 alert로 차단 -->
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

    <!-- 배송 안내 -->
    <section class="p-(--space-4) rounded-2xl bg-(--color-surface) mb-(--space-6)">
      <p class="text-(length:--font-sm) font-bold text-(color:--color-navy) pb-(--space-3) mb-(--space-3) border-b border-(--color-border)">
        {{ shippingSummaryLabel }}
      </p>
      <div class="flex items-center justify-between mb-(--space-2)">
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          배송비
        </p>
        <p class="text-(length:--font-xs) font-bold text-(color:--color-navy)">
          {{ deliveryFeeLabel }}
        </p>
      </div>
      <div class="flex items-center justify-between">
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          도착 예정일
        </p>
        <p class="text-(length:--font-xs) font-bold text-(color:--color-navy)">
          {{ arrivalDateLabel }}
        </p>
      </div>
    </section>

    <!-- 결제 버튼: 금액은 groupPrice * 선택 수량으로 실시간 계산 -->
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
