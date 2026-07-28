<script setup>
import { ref, computed } from 'vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';

// TODO: 사용자 프로필/배송지 DB 연동 예정, 현재는 mock 데이터
const shippingAddress = ref({
  recipientName: '김애월',
  phone: '010-1234-5678',
  address: '서울특별시 광진구 화양동, 세종대점 컴포즈 302호',
});

// TODO: 공동구매 참여 화면에서 선택한 상품/수량/가격 정보를 전달받을 예정, 현재는 mock 데이터
const product = ref({
  name: '프리미엄 사료 15kg',
  optionText: '옵션 없음',
  quantity: 1,
  listPrice: 40000,
  discountedPrice: 28000,
});

// TODO: 등록된 결제 수단(계좌) 연동 예정, 현재는 mock 데이터
const paymentMethod = ref({
  name: '애월 통합 지갑',
  balance: 482300,
});

// 참여 화면에서 전달받은 수량 · 정가 · 할인가 기준으로 결제 금액 계산
const productAmount = computed(() => product.value.listPrice * product.value.quantity);
const discountAmount = computed(
  () => (product.value.listPrice - product.value.discountedPrice) * product.value.quantity,
);
const totalAmount = computed(() => productAmount.value - discountAmount.value);

// 배송지 변경 모달은 아직 미구현 — 버튼만 배치
function handleChangeAddress() {
  // TODO: 배송지 변경 모달 구현 예정
}

// 결제 API/라우팅은 아직 미구현 — 버튼만 배치
function handlePayment() {
  // TODO: 결제 처리 및 이후 라우팅 연동 예정
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+88px)] bg-(--color-bg) min-h-screen"
  >
    <!-- 헤더 -->
    <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-5)">
      결제 확인
    </h1>

    <!-- 배송지 -->
    <section class="bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-4)">
      <div class="flex items-center justify-between mb-(--space-2)">
        <span class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)">
          배송지
        </span>
        <button
          type="button"
          class="text-(length:--font-xs) font-semibold text-(color:--color-slate-dark)"
          @click="handleChangeAddress"
        >
          변경
        </button>
      </div>
      <p class="text-(length:--font-md) font-bold text-(color:--color-navy)">
        {{ shippingAddress.recipientName }} {{ shippingAddress.phone }}
      </p>
      <p class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-1)">
        {{ shippingAddress.address }}
      </p>
    </section>

    <!-- 상품 정보 -->
    <section class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-4)">
      <div class="shrink-0 w-[48px] h-[48px] bg-(--color-white) border border-(--color-border) rounded-(--radius-md)" />
      <div class="flex-1 min-w-0">
        <h3 class="text-(length:--font-md) font-bold text-(color:--color-navy)">
          {{ product.name }}
        </h3>
        <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-(--space-1)">
          {{ product.quantity }}개 · {{ product.optionText }}
        </p>
      </div>
      <p class="shrink-0 text-(length:--font-md) font-bold text-(color:--color-navy)">
        {{ totalAmount.toLocaleString() }}원
      </p>
    </section>

    <!-- 결제 수단 -->
    <section class="mb-(--space-4)">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)">
        결제 수단
      </h2>
      <div class="flex items-center gap-(--space-3) bg-(--color-white) border-2 border-(--color-navy) rounded-(--radius-lg) p-(--space-4)">
        <span class="inline-flex items-center justify-center w-10 h-6 rounded-(--radius-sm) bg-(--color-navy)">
          <IconWallet :size="16" color="var(--color-white)" />
        </span>
        <p class="flex-1 text-(length:--font-md) font-bold text-(color:--color-navy)">
          {{ paymentMethod.name }}
        </p>
        <p class="shrink-0 text-(length:--font-xs) text-(color:--color-gray-500)">
          잔액 {{ paymentMethod.balance.toLocaleString() }}원
        </p>
      </div>
    </section>

    <!-- 결제 금액 -->
    <section class="mb-(--space-4)">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-3)">
        결제 금액
      </h2>
      <div class="flex items-center justify-between text-(length:--font-sm) text-(color:--color-slate-dark) mb-(--space-2)">
        <span>상품 금액</span>
        <span class="text-(color:--color-navy)">{{ productAmount.toLocaleString() }}원</span>
      </div>
      <div class="flex items-center justify-between text-(length:--font-sm) text-(color:--color-gold) mb-(--space-3)">
        <span>공동구매 할인</span>
        <span class="font-bold">-{{ discountAmount.toLocaleString() }}원</span>
      </div>
      <div class="border-t border-(--color-border) pt-(--space-3) flex items-center justify-between">
        <span class="text-(length:--font-base) font-bold text-(color:--color-navy)">총 결제금액</span>
        <span class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
          {{ totalAmount.toLocaleString() }}원
        </span>
      </div>
    </section>

    <!-- 안내 문구 -->
    <p class="bg-(--color-surface) rounded-(--radius-md) p-(--space-4) text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
      공동구매는 목표 인원 달성 시 확정되며, 미달 시 전액 환불됩니다.
    </p>

    <!-- 결제하기 버튼 -->
    <button
      type="button"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) bg-(--color-navy) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-base) font-bold shadow-(--shadow-md)"
      @click="handlePayment"
    >
      {{ totalAmount.toLocaleString() }}원 결제하기
    </button>
  </div>
</template>
