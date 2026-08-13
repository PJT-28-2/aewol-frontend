<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PinAuthSheet from '@/components/common/PinAuthSheet.vue';
import StatusVisual from '@/components/common/StatusVisual.vue';
import {
  MOCK_GROUP_PURCHASE_STATUS,
  MOCK_GROUP_PURCHASE_STATUS_OWNER_BY_GP_ID,
} from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { memberApi } from '@/api/member';
import { formatArrivalDateLabel, formatDDayLabel, getDeadlineTimestamp } from '@/utils/date';
import { useDeadlineTimer } from '@/composables/useDeadlineTimer';
import { useMidnightTick } from '@/composables/useMidnightTick';

const route = useRoute();
const router = useRouter();

const status = ref(null);
const isLoading = ref(true);
const isError = ref(false);
// 작성자 본인 글이면 참여 취소 대신 공동구매 취소 버튼을 보여준다.
// 상태 API 응답의 작성자 memberId와 로그인 유저 memberId를 비교해서 판정
const isOwner = ref(false);

async function loadStatus() {
  isLoading.value = true;
  isError.value = false;

  try {
    if (USE_MOCK_DATA) {
      status.value = { gpId: route.params.gpId, ...MOCK_GROUP_PURCHASE_STATUS };
      isOwner.value = MOCK_GROUP_PURCHASE_STATUS_OWNER_BY_GP_ID[route.params.gpId] ?? false;
    } else {
      const [{ data }, { data: profileData }] = await Promise.all([
        groupPurchaseApi.getStatus(route.params.gpId),
        memberApi.getProfile(),
      ]);
      status.value = data.result ?? null;
      if (!status.value) {
        isError.value = true;
        return;
      }
      const myMemberId = (profileData.result ?? profileData)?.memberId;
      isOwner.value = status.value.memberId === myMemberId;
    }

    // API 응답 경계에서 deadline 유효성을 검증한다. 잘못된 deadline은 getDeadlineTimestamp가
    // NaN을 반환하는데, 이 값을 그대로 타이머에 넘기면 0ms 타이머가 계속 재예약되며
    // 화면 응답을 저하시킬 수 있다
    if (!Number.isFinite(getDeadlineTimestamp(status.value.deadline))) {
      status.value = null;
      isError.value = true;
    }
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadStatus);

// 목록/마이페이지 중 어디서 이 화면으로 왔는지에 따라 "돌아가기" 목적지가 달라짐
// (마이페이지는 상태 화면으로 이동할 때 ?from=my를 붙여서 표시함)
const isFromMyPage = computed(() => route.query.from === 'my');
const backTarget = computed(() => (isFromMyPage.value ? '/group-purchase/my' : '/group-purchase'));
const backLabel = computed(() => (isFromMyPage.value ? '마이페이지로 돌아가기' : '리스트로 돌아가기'));

// replace를 써서 히스토리에 status를 남기지 않는다 — push로 쌓으면 목록/마이페이지에서
// 브라우저 뒤로가기를 눌렀을 때 이 status 화면으로 되돌아와버린다
function goBack() {
  router.replace(backTarget.value);
}

const STATUS_TITLE = {
  waiting: '구매가 보류 중이에요',
  confirmed: '구매가 확정됐어요',
  cancelled: '목표 인원 미달로 취소됐어요',
};
const statusTitle = computed(
  () => STATUS_TITLE[status.value.status] ?? '구매가 보류 중이에요',
);

const statusVisualVariant = computed(() => ({
  waiting: 'info',
  confirmed: 'success',
  cancelled: 'cancel',
}[status.value.status] ?? 'info'));

const progressPercent = computed(() =>
  Math.min(
    (status.value.currentQuantity / status.value.targetQuantity) * 100,
    100,
  ),
);

// 참여자는 구매 수량만큼, 작성자는 단가 그대로(수량 개념 없음) 가격을 보여준다
const purchaseQuantity = computed(() => status.value.participantInfo?.purchaseQuantity ?? 1);
const totalGroupPrice = computed(() => status.value.groupPrice * purchaseQuantity.value);
const totalUnitPrice = computed(() => status.value.unitPrice * purchaseQuantity.value);

// deadline까지 남은 일수를 D-day 라벨로 변환. 표시 전용이라 자정 경계마다만 갱신되면 되므로
// midnightTick을 의존성으로 걸어둔다(초 단위 정확한 마감 여부는 isDeadlinePassed가 담당)
const midnightTick = useMidnightTick();
const deadlineLabel = computed(() => formatDDayLabel(status.value.deadline, new Date(midnightTick.value)));

// 템플릿의 "마감 " 접두어와 결합했을 때 마감 지난 경우 "마감 마감"으로 겹쳐 보이지 않도록 분리
const deadlineDisplayLabel = computed(() =>
  deadlineLabel.value === '마감' ? '마감' : `마감 ${deadlineLabel.value}`,
);

// raw delivery_date를 'M/D(요일) 도착 예정' 형식으로 변환 (DetailView.vue와 동일 계약)
const arrivalDateLabel = computed(() => formatArrivalDateLabel(status.value?.deliveryDate));

// 취소된 건에는 더 이상 배송이 진행되지 않으므로, 보류/확정 상태에서만 노출.
// 'waiting'/'confirmed'를 별도로 다시 나열하면 STATUS_TITLE과 어긋날 위험이 있어,
// STATUS_TITLE에 정의된 상태 중 'cancelled'만 제외하는 방식으로 단일 출처를 유지한다.
// deliveryDate가 없는 경우(API 미반영 등)에도 빈 라벨 대신 행 자체를 숨긴다
const showDeliveryDate = computed(() =>
  Object.keys(STATUS_TITLE).includes(status.value?.status)
  && status.value.status !== 'cancelled'
  && !!arrivalDateLabel.value,
);

// 마감 기한이 지난 공동구매는 참여 취소/공동구매 취소 버튼을 비활성화.
// deadlineLabel은 마감 '당일 00:00'부터 '마감'을 반환해 실제 마감 시각(예: 23:59:59) 이전까지도
// 취소를 막아버리므로, 여기서는 deadline의 실제 시각과 현재 시각을 직접 비교한다
const isDeadlinePassed = useDeadlineTimer(() => status.value?.deadline);

// 취소 비밀번호 인증 바텀시트 — 참여 취소/공동구매 취소 공용
const isPinSheetOpen = ref(false);
const isCancelSuccessSheetOpen = ref(false);
const isCancelling = ref(false);
const cancelError = ref('');

const pinSheetDescription = computed(() =>
  isOwner.value
    ? '공동구매를 취소하고 참여자 전원에게 환불하기 위해 확인해요'
    : '참여를 취소하고 환불받기 위해 확인해요',
);

const cancelSuccessMessage = computed(() =>
  isOwner.value
    ? '참여자 전원에게 결제 금액이 환불 처리돼요'
    : '결제 금액은 환불 처리돼요',
);

// TODO: 저장된 결제 비밀번호와 비교하는 로직 연동 예정 (DB 연동 전이라 현재는 비교 없이 통과)
// PinAuthSheet의 @complete에서 직접 호출됨. 작성자는 groupPurchaseApi.cancel(공동구매 취소),
// 참여자는 groupPurchaseApi.leave(참여 취소)를 호출
async function handleCancelConfirm() {
  if (USE_MOCK_DATA) {
    isPinSheetOpen.value = false;
    status.value = { ...status.value, status: 'cancelled' };
    isCancelSuccessSheetOpen.value = true;
    return;
  }

  cancelError.value = '';
  isCancelling.value = true;
  try {
    if (isOwner.value) {
      await groupPurchaseApi.cancel(route.params.gpId);
    } else {
      await groupPurchaseApi.leave(route.params.gpId);
    }
    // 취소 버튼이 계속 보이지 않도록 이전 상태(waiting)를 취소 완료로 갱신
    status.value = { ...status.value, status: 'cancelled' };
    isCancelSuccessSheetOpen.value = true;
  } catch {
    cancelError.value = isOwner.value
      ? '공동구매 취소에 실패했어요. 다시 시도해주세요.'
      : '참여 취소에 실패했어요. 다시 시도해주세요.';
  } finally {
    isCancelling.value = false;
    isPinSheetOpen.value = false;
  }
}

function confirmCancelSuccess() {
  isCancelSuccessSheetOpen.value = false;
  router.replace(backTarget.value);
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-(--space-6)">
    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center gap-(--space-3) min-h-[60vh]"
    >
      <LoadingSpinner size="lg" />
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        불러오는 중이에요
      </p>
    </div>

    <!-- 에러 상태 -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center gap-(--space-4) min-h-[60vh] px-(--space-4) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 상태를 불러오지 못했어요
      </p>
      <AppButton
        variant="primary"
        @click="loadStatus"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else>
      <!-- 상태 이미지 -->
      <div class="flex justify-center mt-(--space-6) mb-(--space-5)">
        <StatusVisual :variant="statusVisualVariant" />
      </div>

      <!-- 상태 안내 -->
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) text-center mb-(--space-2)"
      >
        {{ statusTitle }}
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) text-center mb-(--space-5)"
      >
        {{ status.noticeMessage }}
      </p>

      <!-- 상품 정보 -->
      <section
        class="mb-(--space-5) flex items-center justify-between rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <div class="min-w-0">
          <h2
            class="text-(length:--font-md) font-bold text-(color:--color-navy)"
          >
            {{ status.productName }}<span v-if="status.participantInfo"> x {{ purchaseQuantity }}개</span>
          </h2>
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            공동구매가 적용
          </p>
        </div>
        <div
          v-if="status.groupPrice != null"
          class="shrink-0 flex items-center gap-(--space-2)"
        >
          <p class="text-(length:--font-md) font-bold text-(color:--color-navy)">
            {{ totalGroupPrice.toLocaleString() }}원
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted) line-through">
            {{ totalUnitPrice.toLocaleString() }}원
          </p>
        </div>
      </section>

      <!-- 참여 현황 -->
      <section class="mb-(--space-5)">
        <h2
          class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-3)"
        >
          참여 현황
        </h2>
        <div
          class="h-(--size-progress-bar) rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)"
        >
          <div
            class="h-full rounded-full bg-(--color-gold)"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <div class="flex items-center justify-between">
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
            {{ status.currentQuantity }}/{{ status.targetQuantity }}개 구매 중
          </p>
          <p
            class="text-(length:--font-xs) font-bold text-(color:--color-gold-dark)"
          >
            {{ deadlineDisplayLabel }}
          </p>
        </div>
      </section>

      <!-- 배송 예정일: 취소된 건은 더 이상 배송이 진행되지 않으므로 보류/확정 상태에서만 노출 -->
      <section
        v-if="showDeliveryDate"
        class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <div class="flex items-center justify-between">
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
            배송 예정일
          </p>
          <p class="text-(length:--font-xs) font-bold text-(color:--color-navy)">
            {{ arrivalDateLabel }}
          </p>
        </div>
      </section>

      <!-- 안내 사항 -->
      <section
        class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <ul class="flex flex-col gap-(--space-3)">
          <li class="flex items-start gap-(--space-2)">
            <span
              class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)"
            />
            <p
              class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed"
            >
              결제는 미리 실행 되고, 실제 구매는 확정 시 이뤄져요
            </p>
          </li>
          <li class="flex items-start gap-(--space-2)">
            <span
              class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)"
            />
            <p
              class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed"
            >
              목표 인원 미달 시 자동으로 취소 · 전액 환불돼요
            </p>
          </li>
          <li class="flex items-start gap-(--space-2)">
            <span
              class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)"
            />
            <p
              class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed"
            >
              결제 상태는 언제든 이 화면에서 다시 확인할 수 있어요
            </p>
          </li>
        </ul>
      </section>

      <!-- 리스트/마이페이지 중 진입 경로에 맞춰 돌아가기 -->
      <AppButton
        variant="primary"
        size="lg"
        block
        class="mb-(--space-3)"
        @click="goBack"
      >
        {{ backLabel }}
      </AppButton>

      <!-- 취소: 버튼은 항상 노출하고, 보류 중이 아니거나(이미 마감) 마감 기한이 지났으면 비활성화만 처리.
           작성자는 공동구매 취소, 참여자는 참여 취소 -->
      <AppButton
        variant="danger"
        size="lg"
        block
        :disabled="status.status !== 'waiting' || isDeadlinePassed"
        :loading="isCancelling"
        @click="isPinSheetOpen = true"
      >
        {{ isOwner ? '공동구매 취소' : '참여 취소하기' }}
      </AppButton>
      <p
        v-if="cancelError"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) text-center mt-(--space-2)"
      >
        {{ cancelError }}
      </p>

      <!-- 취소 비밀번호 인증 바텀시트 -->
      <PinAuthSheet
        v-model="isPinSheetOpen"
        :description="pinSheetDescription"
        @complete="handleCancelConfirm"
      />

      <!-- 취소 완료 안내 바텀시트 -->
      <BottomSheet v-model="isCancelSuccessSheetOpen">
        <div class="flex flex-col items-center text-center">
          <div
            class="flex items-center justify-center size-16 rounded-full bg-(--color-danger-soft) mb-(--space-4)"
          >
            <IconCheck
              :size="28"
              color="var(--color-danger-strong)"
            />
          </div>
          <h2
            class="text-(length:--font-lg) font-bold text-(color:--color-navy) mb-(--space-2)"
          >
            취소되었습니다
          </h2>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) mb-(--space-6)"
          >
            {{ cancelSuccessMessage }}
          </p>
          <AppButton
            variant="primary"
            size="lg"
            block
            @click="confirmCancelSuccess"
          >
            확인
          </AppButton>
        </div>
      </BottomSheet>
    </template>
  </div>
</template>
