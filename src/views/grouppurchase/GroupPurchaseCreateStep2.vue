<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';

// TODO: 실제 등록 연동은 별도 작업에서 구현
const targetQuantity = ref('2');
const deadline = ref('');
const deliveryMethod = '택배 배송';
const deliveryFee = ref('');
const deliveryEstimateDays = ref('3');
const description = ref('');

// 마감일은 오늘로부터 3일 이후만 선택 가능
const minDeadline = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
});

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
          @click="goToPrevStep"
        >
          <IconArrowLeft size="18" color="var(--color-navy)" />
        </button>
        <p
          class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)"
        >
          2/3
        </p>
      </div>
      <h1
        class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)"
      >
        구매 조건
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 목표와 마감일을 정해주세요
      </p>
    </header>

    <!-- 목표 수량: 기본값 2, 1 이상의 숫자만 입력 가능 -->
    <section class="mb-(--space-5)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
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
        />
        <span
          class="absolute right-(--space-4) top-1/2 -translate-y-1/2 text-(length:--font-sm) text-(color:--color-slate-muted)"
        >
          개
        </span>
      </div>
    </section>

    <!-- 마감일: 달력에서 오늘+3일 이후만 선택 가능 -->
    <section class="mb-(--space-5)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        마감일 *
      </label>
      <input
        v-model="deadline"
        type="date"
        :min="minDeadline"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy)"
      />
    </section>

    <!-- 배송 방법: 택배배송 고정, 변경 불가 -->
    <section class="mb-(--space-5)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        배송 방법 *
      </label>
      <input
        type="text"
        :value="deliveryMethod"
        readonly
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) cursor-default"
      />
    </section>

    <!-- 배송비: 직접 입력, 숫자만 -->
    <section class="mb-(--space-5)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
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
        />
        <span
          class="absolute right-(--space-4) top-1/2 -translate-y-1/2 text-(length:--font-sm) text-(color:--color-slate-muted)"
        >
          원
        </span>
      </div>
    </section>

    <!-- 배송 예정일: 숫자 부분만 변경 가능 -->
    <section class="mb-(--space-6)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        배송 예정일 *
      </label>
      <div
        class="flex items-center gap-(--space-1) h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy)"
      >
        <span>마감일로부터</span>
        <input
          :value="deliveryEstimateDays"
          type="text"
          inputmode="numeric"
          placeholder="3"
          :style="{ width: `${Math.max(deliveryEstimateDays.length, 1)}ch` }"
          class="text-center text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted) bg-transparent border-none outline-none"
          @input="handleDeliveryEstimateDaysInput"
        />
        <span>일 이내 발송</span>
      </div>
    </section>

    <!-- 추가 설명: 선택 입력 -->
    <section class="mb-(--space-6)">
      <label
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
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
