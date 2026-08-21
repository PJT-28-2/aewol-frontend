<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import GroupPurchaseProgressBar from '@/components/grouppurchase/GroupPurchaseProgressBar.vue';
import IconPlus from '@/components/common/icons/IconPlus.vue';
import IconMinus from '@/components/common/icons/IconMinus.vue';
import { MOCK_GROUP_PURCHASE_DETAIL } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { formatArrivalDateLabel, formatDDayLabel } from '@/utils/date';
import { useDeadlineTimer } from '@/composables/useDeadlineTimer';
import { useMidnightTick } from '@/composables/useMidnightTick';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const groupPurchase = ref(null);
const isLoading = ref(true);
const isError = ref(false);

// 목록/마이페이지는 관리자를 상세 화면 대신 상태 화면으로 바로 보내지만, 그 라우팅을 거치지 않고
// (URL 직접 입력, 뒤로가기, 공유 링크 등) 이 화면에 온 경우까지 대비해 여기서도 참여 UI를 그리지
// 않고 상태 화면으로 리다이렉트한다. 관리자는 작성자 여부와 무관하게 모든 게시글에 관리 권한을
// 가지므로(2026-08-10 정책 확정), memberId 비교가 아니라 로그인 유저의 role만으로 판정한다.
//
// 목록 화면은 status가 OPEN일 때만 이 화면으로 연결하지만(그 외엔 "마감" 배지만 노출),
// 마감일 전에 관리자가 취소(CANCELLED)했거나 이미 목표 달성으로 확정(COMPLETED)된 게시물도
// 같은 이유(직접 URL 입력 등)로 이 화면에 남아있는 링크/북마크를 통해 들어올 수 있다.
// 이 화면의 CTA는 isExpired(마감 시각)만 검사하고 status는 보지 않으므로, status를 따로
// 확인하지 않으면 이미 닫힌 공동구매에 결제가 들어갈 수 있어 status도 함께 확인한다
async function loadDetail() {
  isLoading.value = true;
  isError.value = false;
  try {
    if (USE_MOCK_DATA) {
      if (MOCK_GROUP_PURCHASE_DETAIL.isAdmin) {
        router.replace(`/group-purchase/${route.params.gpId}/status`);
        return;
      }
      groupPurchase.value = MOCK_GROUP_PURCHASE_DETAIL;
      return;
    }
    const { data } = await groupPurchaseApi.getDetail(route.params.gpId);
    const detail = data.result ?? null;
    if (!detail) {
      isError.value = true;
      return;
    }
    if (authStore.isAdmin || detail.status !== 'OPEN') {
      router.replace(`/group-purchase/${route.params.gpId}/status`);
      return;
    }
    groupPurchase.value = detail;
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadDetail);

const quantity = ref(1);
const quantityError = ref('');

function decreaseQuantity() {
  quantityError.value = '';
  if (quantity.value > 1) quantity.value -= 1; // 최소 수량 1개 미만으로는 내려가지 않도록 제한
}

function increaseQuantity() {
  const nextQuantity = quantity.value + 1;
  if (
    groupPurchase.value.currentQuantity + nextQuantity >
    groupPurchase.value.targetQuantity
  ) {
    quantityError.value = '목표 수량을 초과하여 더 이상 선택할 수 없어요.'; // 목표 수량 초과 선택 차단
    return;
  }
  quantityError.value = '';
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

// 내가 선택한 수량을 반영했을 때의 참여 현황(미리보기)
const displayedCurrentQuantity = computed(
  () => groupPurchase.value.currentQuantity + quantity.value,
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

// raw deadline 값에서 남은 일수를 D-day 라벨로 변환. 표시 전용이라 자정 경계마다만 갱신되면
// 되므로 midnightTick을 의존성으로 걸어둔다(초 단위 정확한 마감 여부는 isExpired가 담당)
const midnightTick = useMidnightTick();
const deadlineLabel = computed(() => formatDDayLabel(groupPurchase.value.deadline, new Date(midnightTick.value)));

// 마감 여부: 마감 후에는 수량 선택/결제를 막는다.
// deadline은 DATETIME이라 날짜만 비교하는 deadlineLabel(자정부터 '마감') 대신, 실제 마감
// 시각과 현재 시각을 비교하는 useDeadlineTimer를 사용한다(GroupPurchaseStatusView.vue와 동일 계약)
const isExpired = useDeadlineTimer(() => groupPurchase.value?.deadline);

// 이미 목표 수량에 도달/초과한 상태(마감 처리 전에도 발생 가능)에서는 기본 선택 수량 1개만으로도
// currentQuantity + quantity가 targetQuantity를 넘어설 수 있어, 스테퍼/CTA를 별도로 막는다
const isQuantityOverTarget = computed(
  () => groupPurchase.value.currentQuantity + quantity.value > groupPurchase.value.targetQuantity,
);

// 템플릿의 "마감까지 " 접두어와 결합했을 때 마감 지난 경우 "마감까지 마감"으로 겹쳐 보이지 않도록 분리
const deadlineDisplayLabel = computed(() =>
  deadlineLabel.value === '마감' ? '마감' : `마감까지 ${deadlineLabel.value}`,
);

// delivery_fee가 0원이면 무료로 표시
const deliveryFeeLabel = computed(() =>
  groupPurchase.value.deliveryFee === 0
    ? '무료'
    : `${groupPurchase.value.deliveryFee?.toLocaleString()}원`,
);

// delivery_method와 배송비 유무를 합친 안내 문구
const shippingSummaryLabel = computed(() => {
  const feeSuffix =
    groupPurchase.value.deliveryFee === 0
      ? '무료배송'
      : '유료배송';
  return `${groupPurchase.value.deliveryMethod} · ${feeSuffix}`;
});

// raw delivery_date를 'M/D(요일) 도착 예정' 형식으로 변환. 잠정(마감일 기준)/확정(달성일 기준)
// 값 계산은 백엔드가 처리해 delivery_date에 반영하므로 프론트는 포맷팅만 담당
const arrivalDateLabel = computed(() => formatArrivalDateLabel(groupPurchase.value.deliveryDate));

function goToPaymentPreview() {
  // CTA는 disabled로 이미 막지만, 결제 미리보기로 넘어가기 전에도 같은 조건을 한 번 더 검증
  if (isExpired.value || isQuantityOverTarget.value) return;
  router.push({
    path: `/group-purchase/${route.params.gpId}/payment-preview`,
    query: { quantity: quantity.value },
  });
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-(--size-cta-bar-height)"
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
        variant="primary"
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
          공동구매 참여
        </h1>
      </header>

      <!-- 상품 정보 -->
      <section class="flex flex-col items-start mb-(--space-6)">
        <div
          class="w-(--size-thumb-lg) h-(--size-thumb-lg) rounded-(--radius-xl) bg-(--color-surface) overflow-hidden mb-(--space-4)"
        >
          <img
            :src="groupPurchase.image"
            :alt="groupPurchase.productName"
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
            {{ groupPurchase.groupPrice?.toLocaleString() }}원
          </p>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) line-through"
          >
            {{ groupPurchase.unitPrice?.toLocaleString() }}원
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
        class="mb-(--space-6) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
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
        <GroupPurchaseProgressBar :percent="progressPercent" />
        <div class="flex items-center justify-between">
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted)"
          >
            {{ deadlineDisplayLabel }}
          </p>
          <!-- 목표까지 남은 수량도 선택 수량 반영 기준으로 갱신 -->
          <p
            class="text-(length:--font-xs) font-bold text-(color:--color-gold-dark)"
          >
            {{ remainingForConfirm }}개 더 모이면 확정
          </p>
        </div>
      </section>

      <!-- 수량 선택 -->
      <section class="mb-(--space-6)">
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
          <!-- 수량 스테퍼: -는 1개에서 비활성화, +는 목표 초과 시 인라인 에러로 차단 -->
          <div class="flex items-center gap-(--space-3)">
            <button
              type="button"
              class="flex items-center justify-center size-(--size-stepper-btn) rounded-(--radius-lg) bg-(--color-white) border border-(--color-border) disabled:opacity-40"
              :disabled="quantity <= 1 || isExpired"
              @click="decreaseQuantity"
            >
              <IconMinus
                size="14"
                color="var(--color-slate-dark)"
              />
            </button>
            <p
              class="w-(--size-stepper-value) text-center text-(length:--font-sm) font-bold text-(color:--color-navy)"
            >
              {{ quantity }}
            </p>
            <button
              type="button"
              class="flex items-center justify-center size-(--size-stepper-btn) rounded-(--radius-lg) bg-(--color-white) border border-(--color-border) disabled:opacity-40"
              :disabled="isExpired || isQuantityOverTarget"
              @click="increaseQuantity"
            >
              <IconPlus
                size="14"
                color="var(--color-slate-dark)"
              />
            </button>
          </div>
        </div>
        <p
          v-if="quantityError"
          class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-danger-strong)"
        >
          {{ quantityError }}
        </p>
      </section>

      <!-- 배송 안내 -->
      <section
        class="mb-(--space-6) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
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

      <!-- 결제 버튼: 금액은 groupPrice * 선택 수량으로 실시간 계산 -->
      <div
        class="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+var(--space-7))] bg-(--color-app-bg) p-(--space-4)"
      >
        <AppButton
          variant="primary"
          size="lg"
          block
          :disabled="isExpired || isQuantityOverTarget"
          @click="goToPaymentPreview"
        >
          {{
            isExpired
              ? '마감된 공동구매예요'
              : isQuantityOverTarget
                ? '목표 수량을 초과했어요'
                : `${totalPrice.toLocaleString()}원 결제하기`
          }}
        </AppButton>
      </div>
    </template>
  </div>
</template>
