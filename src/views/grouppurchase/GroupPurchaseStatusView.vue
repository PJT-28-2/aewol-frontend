<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PinAuthSheet from '@/components/common/PinAuthSheet.vue';
import statusWaitingImage from '@/assets/images/group-purchase-waiting.png';
import statusConfirmedImage from '@/assets/images/group-purchase-confirmed.png';
import statusCancelledImage from '@/assets/images/group-purchase-cancelled.png';
import {
  MOCK_GROUP_PURCHASE_STATUS,
  MOCK_GROUP_PURCHASE_STATUS_OWNER_BY_GP_ID,
} from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { memberApi } from '@/api/member';

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
      return;
    }
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

function goBack() {
  router.push(backTarget.value);
}

const STATUS_TITLE = {
  waiting: '구매가 보류 중이에요',
  confirmed: '구매가 확정됐어요',
  cancelled: '목표 인원 미달로 취소됐어요',
};
const statusTitle = computed(
  () => STATUS_TITLE[status.value.status] ?? '구매가 보류 중이에요',
);

const STATUS_IMAGE = {
  waiting: statusWaitingImage,
  confirmed: statusConfirmedImage,
  cancelled: statusCancelledImage,
};
const statusImage = computed(
  () => STATUS_IMAGE[status.value.status] ?? statusWaitingImage,
);

const progressPercent = computed(() =>
  Math.min(
    (status.value.currentQuantity / status.value.targetQuantity) * 100,
    100,
  ),
);

// deadline까지 남은 일수를 D-day 라벨로 변환
const deadlineLabel = computed(() => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const deadlineDate = new Date(status.value.deadline);
  const startOfDeadline = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate(),
  );
  const diffDays = Math.ceil(
    (startOfDeadline - startOfToday) / (1000 * 60 * 60 * 24),
  );

  return diffDays <= 0 ? '마감' : `D-${diffDays}`;
});

// 템플릿의 "마감 " 접두어와 결합했을 때 마감 지난 경우 "마감 마감"으로 겹쳐 보이지 않도록 분리
const deadlineDisplayLabel = computed(() =>
  deadlineLabel.value === '마감' ? '마감' : `마감 ${deadlineLabel.value}`,
);

// 마감 기한이 지난 공동구매는 참여 취소/공동구매 취소 버튼을 비활성화
const isDeadlinePassed = computed(() => deadlineLabel.value === '마감');

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
  router.push(backTarget.value);
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-6) bg-(--color-bg) min-h-screen">
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
        variant="navy"
        @click="loadStatus"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else>
      <!-- 상태 이미지 -->
      <div class="flex justify-center mt-(--space-6) mb-(--space-5)">
        <div class="w-[139px] h-[139px] overflow-hidden">
          <img
            :src="statusImage"
            alt=""
            class="w-full h-full object-cover"
          >
        </div>
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
        class="flex items-center justify-between bg-(--color-surface) rounded-(--radius-xl) p-(--space-4) mb-(--space-5)"
      >
        <div class="min-w-0">
          <h2
            class="text-(length:--font-md) font-bold text-(color:--color-navy)"
          >
            {{ status.productName }}
          </h2>
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            공동구매가 적용
          </p>
        </div>
        <p
          v-if="!isOwner && status.participantInfo"
          class="shrink-0 text-(length:--font-md) font-bold text-(color:--color-navy)"
        >
          {{ status.participantInfo.paidAmount.toLocaleString() }}원
        </p>
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

      <!-- 안내 사항 -->
      <section
        class="bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) p-(--space-4) mb-(--space-5)"
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
        variant="navy"
        size="lg"
        block
        class="mb-(--space-3)"
        @click="goBack"
      >
        {{ backLabel }}
      </AppButton>

      <!-- 취소: 보류 중일 때만 가능. 작성자는 공동구매 취소, 참여자는 참여 취소. 마감 기한이 지났으면 비활성화 -->
      <AppButton
        v-if="status.status === 'waiting'"
        variant="danger"
        size="lg"
        block
        :disabled="isDeadlinePassed"
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
            variant="navy"
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
