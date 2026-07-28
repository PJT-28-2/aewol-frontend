<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import BottomSheet from '@/components/common/BottomSheet.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase';

// 1~3단계가 공유하는 작성 데이터 (3단계 최종 확인에서 그대로 사용)
const groupPurchaseCreateStore = useGroupPurchaseCreateStore();
const { targetQuantity, deadline, deliveryMethod, deliveryFee, deliveryEstimateDays, description } =
  storeToRefs(groupPurchaseCreateStore); // deadline: 'YYYY-MM-DD'

function sanitizeDigits(value) {
  return value.replace(/[^0-9]/g, '');
}

function handleTargetQuantityInput(event) {
  targetQuantity.value = sanitizeDigits(event.target.value);
}
// 입력을 마쳤을 때 1 미만이면 1로 보정
function clampTargetQuantity() {
  const value = Number(targetQuantity.value);
  targetQuantity.value = String(!value || value < 1 ? 1 : value);
}

function handleDeliveryFeeInput(event) {
  deliveryFee.value = sanitizeDigits(event.target.value);
}

function handleDeliveryEstimateDaysInput(event) {
  deliveryEstimateDays.value = sanitizeDigits(event.target.value);
}

// 로컬 날짜 기준 'YYYY-MM-DD' 키 (toISOString은 UTC 변환으로 하루 밀릴 수 있어 사용하지 않음)
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = new Date();
// 마감일은 오늘로부터 3일 이후만 선택 가능
const minDeadlineDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
const minDeadlineKey = formatDateKey(minDeadlineDate);

const isDeadlineSheetOpen = ref(false);
const calendarViewYear = ref(minDeadlineDate.getFullYear());
const calendarViewMonth = ref(minDeadlineDate.getMonth());
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const calendarTitle = computed(() => `${calendarViewYear.value}년 ${calendarViewMonth.value + 1}월`);

const calendarCells = computed(() => {
  const firstOfMonth = new Date(calendarViewYear.value, calendarViewMonth.value, 1);
  const daysInMonth = new Date(calendarViewYear.value, calendarViewMonth.value + 1, 0).getDate();
  const cells = Array(firstOfMonth.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(calendarViewYear.value, calendarViewMonth.value, day));
  }
  return cells;
});

const canGoPrevMonth = computed(
  () =>
    calendarViewYear.value > minDeadlineDate.getFullYear() ||
    (calendarViewYear.value === minDeadlineDate.getFullYear() &&
      calendarViewMonth.value > minDeadlineDate.getMonth()),
);

function goPrevMonth() {
  if (!canGoPrevMonth.value) return;
  if (calendarViewMonth.value === 0) {
    calendarViewMonth.value = 11;
    calendarViewYear.value -= 1;
  } else {
    calendarViewMonth.value -= 1;
  }
}

function goNextMonth() {
  if (calendarViewMonth.value === 11) {
    calendarViewMonth.value = 0;
    calendarViewYear.value += 1;
  } else {
    calendarViewMonth.value += 1;
  }
}

function isBeforeMinDeadline(date) {
  return formatDateKey(date) < minDeadlineKey;
}

function isSelectedDeadline(date) {
  return deadline.value !== '' && formatDateKey(date) === deadline.value;
}

function selectDeadline(date) {
  if (isBeforeMinDeadline(date)) return;
  deadline.value = formatDateKey(date);
  isDeadlineSheetOpen.value = false;
}

const deadlineDisplayText = computed(() => {
  if (deadline.value === '') return '마감일을 선택해주세요';
  const [year, month, day] = deadline.value.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
});

// 목표 수량/마감일/배송비/배송 예정일만 필수, 추가 설명은 선택 입력이라 검사에서 제외
const isFormValid = computed(
  () =>
    Number(targetQuantity.value) >= 1 &&
    deadline.value !== '' &&
    deliveryFee.value !== '' &&
    Number(deliveryEstimateDays.value) >= 1,
);

const router = useRouter();
function goToPrevStep() {
  router.push('/group-purchase/create');
}
function goToNextStep() {
  router.push('/group-purchase/create/step3');
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-4)">
        <button
          type="button"
          class="inline-flex text-(color:--color-navy)"
          aria-label="이전 단계로"
          @click="goToPrevStep"
        >
          <IconArrowLeft
            size="18"
            color="var(--color-navy)"
          />
        </button>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          2/3
        </p>
      </div>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        구매 조건
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 목표와 마감일을 정해주세요
      </p>
    </header>

    <!-- 목표 수량: 기본값 2, 1 이상의 숫자만 입력 가능 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        목표 수량 *
      </label>
      <div class="relative">
        <input
          :value="targetQuantity"
          type="text"
          inputmode="numeric"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-8) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) font-bold text-(color:--color-navy)"
          @input="handleTargetQuantityInput"
          @blur="clampTargetQuantity"
        >
        <span class="absolute right-(--space-4) top-1/2 -translate-y-1/2 text-(length:--font-sm) text-(color:--color-slate-muted)">
          개
        </span>
      </div>
    </section>

    <!-- 마감일: 커스텀 달력 바텀시트에서 오늘+3일 이후만 선택 가능 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        마감일 *
      </label>
      <button
        type="button"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) flex items-center justify-between"
        @click="isDeadlineSheetOpen = true"
      >
        <span
          class="text-(length:--font-sm)"
          :class="deadline === '' ? 'text-(color:--color-slate-muted)' : 'text-(color:--color-navy)'"
        >
          {{ deadlineDisplayText }}
        </span>
        <IconChevronDown
          size="14"
          color="var(--color-slate-muted)"
        />
      </button>
    </section>

    <BottomSheet
      v-model="isDeadlineSheetOpen"
      title="마감일 선택"
    >
      <div class="flex items-center justify-between mb-(--space-4)">
        <button
          type="button"
          class="p-(--space-2) disabled:opacity-30"
          aria-label="이전 달"
          :disabled="!canGoPrevMonth"
          @click="goPrevMonth"
        >
          <IconArrowLeft
            size="16"
            color="var(--color-navy)"
          />
        </button>
        <p class="text-(length:--font-base) font-bold text-(color:--color-navy)">
          {{ calendarTitle }}
        </p>
        <button
          type="button"
          class="p-(--space-2)"
          aria-label="다음 달"
          @click="goNextMonth"
        >
          <IconArrowLeft
            size="16"
            color="var(--color-navy)"
            class="rotate-180"
          />
        </button>
      </div>

      <div class="grid grid-cols-7 mb-(--space-2)">
        <p
          v-for="label in weekdayLabels"
          :key="label"
          class="text-center text-(length:--font-xs) font-semibold text-(color:--color-slate-muted)"
        >
          {{ label }}
        </p>
      </div>

      <div class="grid grid-cols-7 gap-(--space-1)">
        <template
          v-for="(cell, index) in calendarCells"
          :key="index"
        >
          <div v-if="!cell" />
          <button
            v-else
            type="button"
            class="aspect-square rounded-full flex items-center justify-center text-(length:--font-sm)"
            :class="[
              isBeforeMinDeadline(cell)
                ? 'text-(color:--color-gray-300) cursor-not-allowed'
                : 'text-(color:--color-navy)',
              isSelectedDeadline(cell) ? 'bg-(--color-navy) text-(color:--color-white) font-bold' : '',
            ]"
            :aria-label="`${calendarViewYear}년 ${calendarViewMonth + 1}월 ${cell.getDate()}일`"
            :disabled="isBeforeMinDeadline(cell)"
            @click="selectDeadline(cell)"
          >
            {{ cell.getDate() }}
          </button>
        </template>
      </div>
    </BottomSheet>

    <!-- 배송 방법: 택배배송 고정, 변경 불가 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        배송 방법 *
      </label>
      <input
        type="text"
        :value="deliveryMethod"
        readonly
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) cursor-default"
      >
    </section>

    <!-- 배송비: 직접 입력, 숫자만 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        배송비 *
      </label>
      <div class="relative">
        <input
          :value="deliveryFee"
          type="text"
          inputmode="numeric"
          placeholder="0"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-8) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
          @input="handleDeliveryFeeInput"
        >
        <span class="absolute right-(--space-4) top-1/2 -translate-y-1/2 text-(length:--font-sm) text-(color:--color-slate-muted)">
          원
        </span>
      </div>
    </section>

    <!-- 배송 예정일: 숫자 부분만 변경 가능 -->
    <section class="mb-(--space-6)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        배송 예정일 *
      </label>
      <div class="flex items-center gap-(--space-1) h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy)">
        <span>마감일로부터</span>
        <input
          :value="deliveryEstimateDays"
          type="text"
          inputmode="numeric"
          placeholder="3"
          :style="{ width: `${Math.max(deliveryEstimateDays.length, 1)}ch` }"
          class="text-center text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted) bg-transparent border-none outline-none"
          @input="handleDeliveryEstimateDaysInput"
        >
        <span>일 이내 발송</span>
      </div>
    </section>

    <!-- 추가 설명: 선택 입력 -->
    <section class="mb-(--space-6)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        추가 설명
      </label>
      <textarea
        v-model="description"
        rows="4"
        placeholder="상품 상세 설명, 주의사항 등을 입력하세요"
        class="w-full h-[130px] p-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted) resize-none"
      />
    </section>

    <!-- 이전 / 다음 -->
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
        class="flex-1 h-[52px] rounded-2xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold disabled:opacity-40"
        :disabled="!isFormValid"
        @click="goToNextStep"
      >
        다음
      </button>
    </div>
  </div>
</template>
