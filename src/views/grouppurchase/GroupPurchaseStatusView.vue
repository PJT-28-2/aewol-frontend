<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconDelete from '@/components/common/icons/IconDelete.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import statusWaitingImage from '@/assets/images/status-waiting.png';

const route = useRoute();
const router = useRouter();

const status = ref(null);
const isLoading = ref(true);
const isError = ref(false);

// TODO: groupPurchaseApi.getStatus(route.params.gpId) 연동 예정, 현재는 응답 포맷과 동일한 mock 데이터
// productName은 API 응답의 title 필드에 대응
async function loadStatus() {
  isLoading.value = true;
  isError.value = false;

  try {
    status.value = {
      gpId: route.params.gpId,
      productName: '프리미엄 사료 15kg',
      status: 'waiting',
      currentQuantity: 3,
      targetQuantity: 5,
      deadline: '2026-07-30T23:59:59',
      participantInfo: {
        participantId: 10523,
        paidAmount: 28000,
        paymentStatus: 'COMPLETED',
        paidAt: '2026-07-22T14:45:00',
      },
      noticeMessage: '목표 인원이 모두 모이면 공동구매가 최종 확정됩니다.',
    };
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadStatus);

// confirmed/cancelled는 아직 디자인이 없어 노출 문구만 정의, 화면 요소(이미지 등)는 waiting 기준으로 통일
const STATUS_TITLE = {
  waiting: '구매가 보류 중이에요',
  confirmed: '구매가 확정됐어요',
  cancelled: '목표 인원 미달로 취소됐어요',
};
const statusTitle = computed(
  () => STATUS_TITLE[status.value.status] ?? '구매가 보류 중이에요',
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

// 참여 취소 비밀번호 인증 바텀시트 (GroupPurchasePaymentPreview.vue와 동일한 PIN 패턴)
const PIN_LENGTH = 6;
const pinInput = ref('');
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const isPinSheetOpen = ref(false);
const isCancelSuccessSheetOpen = ref(false);

function openPinSheet() {
  pinInput.value = '';
  isPinSheetOpen.value = true;
}

function closePinSheet() {
  isPinSheetOpen.value = false;
}

function handlePinKeyPress(digit) {
  if (!digit || pinInput.value.length >= PIN_LENGTH) return;

  pinInput.value += digit;
  if (pinInput.value.length === PIN_LENGTH) {
    handlePinComplete();
  }
}

function handlePinBackspace() {
  pinInput.value = pinInput.value.slice(0, -1);
}

// TODO: 저장된 결제 비밀번호와 비교하는 로직 연동 예정 (DB 연동 전이라 현재는 비교 없이 통과)
function handlePinComplete() {
  closePinSheet();
  cancelParticipation();
}

// TODO: 참여 취소 + 환불 API 연동 예정 (groupPurchaseApi.leave 활용 여부는 취소/환불 정책 확정 후 결정), 현재는 성공 처리만 시뮬레이션
function cancelParticipation() {
  isCancelSuccessSheetOpen.value = true;
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
      <button
        type="button"
        class="px-(--space-5) py-(--space-3) rounded-(--radius-lg) bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-bold"
        @click="loadStatus"
      >
        다시 시도
      </button>
    </div>

    <template v-else>
      <!-- 상태 이미지 -->
      <div class="flex justify-center mt-(--space-6) mb-(--space-5)">
        <div class="w-[139px] h-[139px] overflow-hidden">
          <img
            :src="statusWaitingImage"
            alt=""
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- 상태 안내 -->
      <h1
        class="text-(length:--font-lg) font-bold text-(color:--color-navy) text-center mb-(--space-2)"
      >
        {{ statusTitle }}
      </h1>
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-muted) text-center mb-(--space-5)"
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
      <button
        type="button"
        class="w-full h-13 rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold mb-(--space-3)"
        @click="goToList"
      >
        리스트로 돌아가기
      </button>

      <!-- 참여 취소하기: 보류 중일 때만 취소 가능 -->
      <button
        v-if="status.status === 'waiting'"
        type="button"
        class="w-full h-[50px] rounded-(--radius-lg) bg-(--color-white) border-[1.2px] border-(--color-danger-soft) text-(color:--color-danger-strong) text-(length:--font-sm) font-bold"
        @click="openPinSheet"
      >
        참여 취소하기
      </button>

      <!-- 참여 취소 비밀번호 인증 바텀시트 -->
      <BottomSheet v-model="isPinSheetOpen">
        <div class="text-center">
          <h2
            class="text-(length:--font-lg) font-bold text-(color:--color-navy)"
          >
            비밀번호를 입력해주세요
          </h2>
          <p
            class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2)"
          >
            참여를 취소하고 환불받기 위해 확인해요
          </p>

          <div
            class="flex items-center justify-center gap-(--space-2) mt-(--space-6)"
          >
            <span
              v-for="index in PIN_LENGTH"
              :key="index"
              class="w-3 h-3 rounded-full"
              :class="
                index <= pinInput.length
                  ? 'bg-(--color-navy)'
                  : 'border border-(--color-border)'
              "
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-(--space-4) mt-(--space-7)">
          <template v-for="key in keypadKeys" :key="key || 'blank'">
            <div v-if="key === ''" class="h-14" aria-hidden="true" />
            <button
              v-else
              type="button"
              class="h-14 flex items-center justify-center text-(length:--font-2xl) font-bold text-(color:--color-navy)"
              :aria-label="key === '⌫' ? '지우기' : key"
              @click="
                key === '⌫' ? handlePinBackspace() : handlePinKeyPress(key)
              "
            >
              <IconDelete
                v-if="key === '⌫'"
                :size="20"
                color="var(--color-navy)"
                aria-hidden="true"
              />
              <template v-else>{{ key }}</template>
            </button>
          </template>
        </div>
      </BottomSheet>

      <!-- 참여 취소 완료 안내 바텀시트 -->
      <BottomSheet v-model="isCancelSuccessSheetOpen">
        <div class="flex flex-col items-center text-center">
          <div
            class="flex items-center justify-center size-16 rounded-full bg-(--color-danger-soft) mb-(--space-4)"
          >
            <IconCheck :size="28" color="var(--color-danger-strong)" />
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
          <button
            type="button"
            class="w-full h-13 rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold"
            @click="confirmCancelSuccess"
          >
            확인
          </button>
        </div>
      </BottomSheet>
    </template>
  </div>
</template>
