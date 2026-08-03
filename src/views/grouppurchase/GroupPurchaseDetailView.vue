<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { MOCK_GROUP_PURCHASE_DETAIL } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';

const route = useRoute();
const router = useRouter();

const groupPurchase = ref(null);
const isLoading = ref(true);
const isError = ref(false);

async function loadDetail() {
  isLoading.value = true;
  isError.value = false;
  try {
    if (USE_MOCK_DATA) {
      groupPurchase.value = MOCK_GROUP_PURCHASE_DETAIL;
      return;
    }
    const { data } = await groupPurchaseApi.getDetail(route.params.gpId);
    groupPurchase.value = data.result ?? null;
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadDetail);

// isOwner: 상세 API 응답의 작성자 member_id와 로그인 유저 member_id 비교 결과로 교체 예정.
// 지금은 마이페이지의 "작성" 글 카드가 붙여주는 ?owner=1 쿼리로 흉내냄 —
// true면 마이페이지의 "작성" 글로 들어온 경우이므로 수량 선택/결제 없이 읽기 전용으로 보여줌
const isOwner = computed(() => route.query.owner === '1');

const WEEKDAY_LABELS = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
];

// 'YYYY-MM-DD' 문자열을 UTC 파싱으로 인한 날짜 밀림 없이 로컬 자정 Date로 변환
function toLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

const quantity = ref(1);

function decreaseQuantity() {
  if (quantity.value > 1) quantity.value -= 1; // 최소 수량 1개 미만으로는 내려가지 않도록 제한
}

function increaseQuantity() {
  const nextQuantity = quantity.value + 1;
  if (
    groupPurchase.value.currentQuantity + nextQuantity >
    groupPurchase.value.targetQuantity
  ) {
    alert('목표 수량을 초과하여 더 이상 선택할 수 없습니다.'); // 목표 수량 초과 선택 차단
    return;
  }
  quantity.value = nextQuantity;
}

// 정가 대비 공동구매가 할인율을 직접 저장하지 않고 계산으로 도출
const discountRate = computed(() =>
  Math.round(
    (1 -
      groupPurchase.value.groupPrice /
        groupPurchase.value.unitPrice) *
      100,
  ),
);

// 내가 선택한 수량을 반영했을 때의 참여 현황(미리보기). 작성자가 자기 글을 보는 경우엔 구매 미리보기가 필요 없어 현재 수량 그대로 표시
const displayedCurrentQuantity = computed(() =>
  isOwner.value
    ? groupPurchase.value.currentQuantity
    : groupPurchase.value.currentQuantity + quantity.value,
);

// 목표 수량까지 남은 개수 (음수 방지)
const remainingForConfirm = computed(() =>
  Math.max(
    groupPurchase.value.targetQuantity -
      displayedCurrentQuantity.value,
    0,
  ),
);

// 진행률 바 너비(%) 계산, 100% 초과 방지
const progressPercent = computed(() =>
  Math.min(
    (displayedCurrentQuantity.value /
      groupPurchase.value.targetQuantity) *
      100,
    100,
  ),
);

// 선택 수량에 따라 실시간으로 바뀌는 결제 금액
const totalPrice = computed(
  () => groupPurchase.value.groupPrice * quantity.value,
);

// raw deadline 값에서 남은 일수를 D-day 라벨로 변환
const deadlineLabel = computed(() => {
  const diffDays = Math.ceil(
    (toLocalDate(groupPurchase.value.deadline) -
      startOfToday()) /
      (1000 * 60 * 60 * 24),
  );

  // 남은 일수가 0일 이하인 경우 "마감" 반환
  if (diffDays <= 0) {
    return '마감';
  }

  return `D-${diffDays}`;
});

// 마감 여부: 마감 후에는 수량 선택/결제를 막는다
const isExpired = computed(() => deadlineLabel.value === '마감');

// delivery_fee가 0원이면 무료로 표시
const deliveryFeeLabel = computed(() =>
  groupPurchase.value.deliveryFee === 0
    ? '무료'
    : `${groupPurchase.value.deliveryFee.toLocaleString()}원`,
);

// delivery_method와 배송비 유무를 합친 안내 문구
const shippingSummaryLabel = computed(() => {
  const feeSuffix =
    groupPurchase.value.deliveryFee === 0
      ? '무료배송'
      : '유료배송';
  return `${groupPurchase.value.deliveryMethod} · ${feeSuffix}`;
});

// raw delivery_date를 'M/D(요일) 도착 보장' 형식으로 변환
const arrivalDateLabel = computed(() => {
  const date = toLocalDate(groupPurchase.value.deliveryDate);
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]}) 도착 보장`;
});

function goToPaymentPreview() {
  router.push({
    path: `/group-purchase/${route.params.gpId}/payment-preview`,
    query: { quantity: quantity.value },
  });
}
</script>

<template>
  <div
    class="p-(--space-4) bg-(--color-bg) min-h-screen"
    :class="
      isOwner
        ? 'pb-(--space-6)'
        : 'pb-[calc(var(--bottom-nav-height)+var(--size-cta-bar-height))]'
    "
  >
    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="flex justify-center py-(--space-9)"
    >
      <LoadingSpinner />
    </div>

    <!-- 에러 상태 -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center gap-(--space-4) py-(--space-9) px-(--space-4) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 정보를 불러오지 못했어요
      </p>
      <AppButton
        variant="navy"
        @click="loadDetail"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else-if="groupPurchase">
      <header class="mb-(--space-5)">
        <h1
          class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
        >
          {{ isOwner ? '나의 공동구매' : '공동구매 참여' }}
        </h1>
      </header>

      <!-- 상품 정보 -->
      <section class="flex flex-col items-start mb-(--space-6)">
        <div
          class="w-(--size-thumb-lg) h-(--size-thumb-lg) rounded-(--radius-xl) bg-(--color-surface) overflow-hidden mb-(--space-4)"
        >
          <img
            :src="groupPurchase.image"
            alt="groupPurchase.productName"
            class="w-full h-full object-cover"
          >
        </div>
        <h2
          class="text-(length:--font-md) font-bold text-(color:--color-navy) mb-(--space-2)"
        >
          {{ groupPurchase.productName }}
        </h2>
        <div class="flex items-center gap-(--space-2)">
          <p
            class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
          >
            {{ groupPurchase.groupPrice.toLocaleString() }}원
          </p>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) line-through"
          >
            {{ groupPurchase.unitPrice.toLocaleString() }}원
          </p>
          <!-- 할인율은 저장된 값이 아니라 discountRate computed로 계산된 값 -->
          <span
            class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-gold-surface) text-(color:--color-gold-dark) text-(length:--font-xs) font-bold"
          >
            {{ discountRate }}% 할인
          </span>
        </div>
      </section>

      <!-- 참여 현황 -->
      <section
        class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-6)"
      >
        <div
          class="flex items-center justify-between mb-(--space-3)"
        >
          <p
            class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)"
          >
            현재 수량
          </p>
          <!-- 내가 선택한 수량이 더해진 현재 수량(미리보기) -->
          <p
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >
            {{ displayedCurrentQuantity }}/{{
              groupPurchase.targetQuantity
            }}개
          </p>
        </div>
        <!-- 진행률 바도 선택 수량 반영 기준으로 실시간 갱신 -->
        <div
          class="h-(--size-progress-bar) rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)"
        >
          <div
            class="h-full rounded-full bg-(--color-gold)"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <div class="flex items-center justify-between">
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted)"
          >
            마감까지 {{ deadlineLabel }}
          </p>
          <!-- 목표까지 남은 수량도 선택 수량 반영 기준으로 갱신 -->
          <p
            class="text-(length:--font-xs) font-bold text-(color:--color-gold-dark)"
          >
            {{ remainingForConfirm }}개 더 모이면 확정
          </p>
        </div>
      </section>

      <!-- 수량 선택: 작성자가 자기 글을 보는 경우엔 구매 대상이 아니므로 숨김 -->
      <section
        v-if="!isOwner"
        class="mb-(--space-6)"
      >
        <p
          class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-3)"
        >
          수량 선택
        </p>
        <div
          class="flex items-center justify-between h-(--size-stepper-box) px-(--space-4) rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border)"
        >
          <p
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >
            {{ quantity }}개
          </p>
          <!-- 수량 스테퍼: -는 1개에서 비활성화, +는 목표 초과 시 alert로 차단 -->
          <div class="flex items-center gap-(--space-3)">
            <button
              type="button"
              class="size-(--size-stepper-btn) rounded-(--radius-lg) bg-(--color-white) border border-(--color-border) text-(length:--font-md) font-bold text-(color:--color-slate-dark) disabled:opacity-40"
              :disabled="quantity <= 1 || isExpired"
              @click="decreaseQuantity"
            >
              −
            </button>
            <p
              class="w-(--size-stepper-value) text-center text-(length:--font-sm) font-bold text-(color:--color-navy)"
            >
              {{ quantity }}
            </p>
            <button
              type="button"
              class="size-(--size-stepper-btn) rounded-(--radius-lg) bg-(--color-white) border border-(--color-border) text-(length:--font-md) font-bold text-(color:--color-slate-dark) disabled:opacity-40"
              :disabled="isExpired"
              @click="increaseQuantity"
            >
              +
            </button>
          </div>
        </div>
      </section>

      <!-- 배송 안내 -->
      <section
        class="p-(--space-4) rounded-(--radius-xl) bg-(--color-surface) mb-(--space-6)"
      >
        <p
          class="text-(length:--font-sm) font-bold text-(color:--color-navy) pb-(--space-3) mb-(--space-3) border-b border-(--color-border)"
        >
          {{ shippingSummaryLabel }}
        </p>
        <div
          class="flex items-center justify-between mb-(--space-2)"
        >
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted)"
          >
            배송비
          </p>
          <p
            class="text-(length:--font-xs) font-bold text-(color:--color-navy)"
          >
            {{ deliveryFeeLabel }}
          </p>
        </div>
        <div class="flex items-center justify-between">
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted)"
          >
            도착 예정일
          </p>
          <p
            class="text-(length:--font-xs) font-bold text-(color:--color-navy)"
          >
            {{ arrivalDateLabel }}
          </p>
        </div>
      </section>

      <!-- 결제 버튼: 금액은 groupPrice * 선택 수량으로 실시간 계산. 작성자가 자기 글을 보는 경우엔 결제 대상이 아니므로 숨김 -->
      <div
        v-if="!isOwner"
        class="fixed bottom-(--bottom-nav-height) inset-x-0 p-(--space-4) bg-(--color-white)"
      >
        <AppButton
          variant="navy"
          size="lg"
          block
          :disabled="isExpired"
          @click="goToPaymentPreview"
        >
          {{ isExpired ? '마감된 공동구매예요' : `${totalPrice.toLocaleString()}원 결제하기` }}
        </AppButton>
      </div>
    </template>
  </div>
</template>
