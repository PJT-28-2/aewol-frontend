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
import { MOCK_GROUP_PURCHASE_STATUS } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';

const route = useRoute();
const router = useRouter();

const status = ref(null);
const isLoading = ref(true);
const isError = ref(false);

async function loadStatus() {
  isLoading.value = true;
  isError.value = false;

  try {
    if (USE_MOCK_DATA) {
      status.value = { gpId: route.params.gpId, ...MOCK_GROUP_PURCHASE_STATUS };
      return;
    }
    const { data } = await groupPurchaseApi.getStatus(route.params.gpId);
    status.value = data.result ?? null;
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadStatus);

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

function goToList() {
  router.push('/group-purchase');
}

// 참여 취소 비밀번호 인증 바텀시트
const isPinSheetOpen = ref(false);
const isCancelSuccessSheetOpen = ref(false);
const isCancelling = ref(false);
const cancelError = ref('');

// TODO: 저장된 결제 비밀번호와 비교하는 로직 연동 예정 (DB 연동 전이라 현재는 비교 없이 통과)
async function cancelParticipation() {
  if (USE_MOCK_DATA) {
    isCancelSuccessSheetOpen.value = true;
    return;
  }

  cancelError.value = '';
  isCancelling.value = true;
  try {
    await groupPurchaseApi.leave(route.params.gpId);
    isCancelSuccessSheetOpen.value = true;
  } catch {
    cancelError.value = '참여 취소에 실패했어요. 다시 시도해주세요.';
  } finally {
    isCancelling.value = false;
  }
}

function confirmCancelSuccess() {
  isCancelSuccessSheetOpen.value = false;
  router.push('/group-purchase');
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
            마감 {{ deadlineLabel }}
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

      <!-- 리스트로 돌아가기 -->
      <AppButton
        variant="navy"
        size="lg"
        block
        class="mb-(--space-3)"
        @click="goToList"
      >
        리스트로 돌아가기
      </AppButton>

      <!-- 참여 취소하기: 보류 중일 때만 취소 가능 -->
      <AppButton
        v-if="status.status === 'waiting'"
        variant="danger"
        size="lg"
        block
        :loading="isCancelling"
        @click="isPinSheetOpen = true"
      >
        참여 취소하기
      </AppButton>
      <p
        v-if="cancelError"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) text-center mt-(--space-2)"
      >
        {{ cancelError }}
      </p>

      <!-- 참여 취소 비밀번호 인증 바텀시트 -->
      <PinAuthSheet
        v-model="isPinSheetOpen"
        description="참여를 취소하고 환불받기 위해 확인해요"
        @complete="cancelParticipation"
      />

      <!-- 참여 취소 완료 안내 바텀시트 -->
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
            결제 금액은 환불 처리되며, 공동구매 목록으로 이동해요
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
