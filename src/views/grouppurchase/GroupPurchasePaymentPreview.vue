<script setup>
import { ref, computed } from 'vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';

// TODO: 사용자 프로필/배송지 DB 연동 예정, 현재는 mock 데이터
// 등록된 배송지가 없는 상태를 확인하기 위해 초기값은 null로 둠
const shippingAddress = ref(null);

// TODO: 공동구매 참여 화면에서 선택한 상품/수량/가격 정보를 전달받을 예정, 현재는 mock 데이터
const product = ref({
  productName: '프리미엄 사료 15kg',
  optionText: '옵션 없음',
  purchaseQuantity: 1,
  totalPrice: 40000,
  totalDiscountedPrice: 28000,
});

// TODO: 등록된 결제 수단(계좌) 연동 예정, 현재는 mock 데이터
const paymentMethod = ref({
  name: '애월 통합 지갑',
  balance: 482300,
});

// 참여 화면에서 전달받은 수량 · 정가 · 할인가 기준으로 결제 금액 계산
const productAmount = computed(
  () => product.value.totalPrice * product.value.purchaseQuantity,
);
const discountAmount = computed(
  () =>
    (product.value.totalPrice - product.value.totalDiscountedPrice) *
    product.value.purchaseQuantity,
);
const totalAmount = computed(() => productAmount.value - discountAmount.value);

// 배송지 변경 바텀시트 상태 및 입력 폼 (현재 배송지 값으로 초기화)
const isAddressSheetOpen = ref(false);
const addressForm = ref({
  name: '',
  phone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
});

function handleChangeAddress() {
  addressForm.value = {
    name: shippingAddress.value?.recipientName ?? '',
    phone: shippingAddress.value?.recipientPhone ?? '',
    postalCode: '',
    address: shippingAddress.value?.address ?? '',
    addressDetail: '',
  };
  isAddressSheetOpen.value = true;
}

// TODO: 우편번호(주소 검색) API 연동 예정
function handleSearchAddress() {}

function closeAddressSheet() {
  isAddressSheetOpen.value = false;
}

// 입력한 배송지로 교체 (현재는 화면 상태만 갱신, DB 저장은 추후 연동)
function confirmAddress() {
  shippingAddress.value = {
    recipientName: addressForm.value.name,
    recipientPhone: addressForm.value.phone,
    address: addressForm.value.addressDetail
      ? `${addressForm.value.address}, ${addressForm.value.addressDetail}`
      : addressForm.value.address,
  };
  isAddressSheetOpen.value = false;
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
    <h1
      class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-5)"
    >
      결제 확인
    </h1>

    <!-- 배송지 -->
    <section
      class="bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-4)"
    >
      <template v-if="shippingAddress">
        <div class="flex items-center justify-between mb-(--space-2)">
          <span
            class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
          >
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
          {{ shippingAddress.recipientName }} {{ shippingAddress.recipientPhone }}
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-1)"
        >
          {{ shippingAddress.address }}
        </p>
      </template>
      <template v-else>
        <span
          class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
        >
          배송지
        </span>
        <p
          class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2) mb-(--space-3)"
        >
          등록된 배송지가 없어요
        </p>
        <button
          type="button"
          class="w-full h-[46px] bg-(--color-white) border-[1.2px] border-(--color-navy) rounded-(--radius-full) text-(length:--font-xs) font-bold text-(color:--color-navy)"
          @click="handleChangeAddress"
        >
          + 배송지 추가하기
        </button>
      </template>
    </section>

    <!-- 상품 정보 -->
    <section
      class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-4)"
    >
      <div
        class="shrink-0 w-[48px] h-[48px] bg-(--color-white) border border-(--color-border) rounded-(--radius-md)"
      />
      <div class="flex-1 min-w-0">
        <h3 class="text-(length:--font-md) font-bold text-(color:--color-navy)">
          {{ product.productName }}
        </h3>
        <p
          class="text-(length:--font-xs) text-(color:--color-gray-500) mt-(--space-1)"
        >
          {{ product.purchaseQuantity }}개 · {{ product.optionText }}
        </p>
      </div>
      <p
        class="shrink-0 text-(length:--font-md) font-bold text-(color:--color-navy)"
      >
        {{ totalAmount.toLocaleString() }}원
      </p>
    </section>

    <!-- 결제 수단 -->
    <section class="mb-(--space-4)">
      <h2
        class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        결제 수단
      </h2>
      <div
        class="flex items-center gap-(--space-3) bg-(--color-white) border-2 border-(--color-navy) rounded-(--radius-lg) p-(--space-4)"
      >
        <span
          class="inline-flex items-center justify-center w-10 h-6 rounded-(--radius-sm) bg-(--color-navy)"
        >
          <IconWallet :size="16" color="var(--color-white)" />
        </span>
        <p
          class="flex-1 text-(length:--font-md) font-bold text-(color:--color-navy)"
        >
          {{ paymentMethod.name }}
        </p>
        <p
          class="shrink-0 text-(length:--font-xs) text-(color:--color-gray-500)"
        >
          잔액 {{ paymentMethod.balance.toLocaleString() }}원
        </p>
      </div>
    </section>

    <!-- 결제 금액 -->
    <section class="mb-(--space-4)">
      <h2
        class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-3)"
      >
        결제 금액
      </h2>
      <div
        class="flex items-center justify-between text-(length:--font-sm) text-(color:--color-slate-dark) mb-(--space-2)"
      >
        <span>상품 금액</span>
        <span class="text-(color:--color-navy)"
          >{{ productAmount.toLocaleString() }}원</span
        >
      </div>
      <div
        class="flex items-center justify-between text-(length:--font-sm) text-(color:--color-gold) mb-(--space-3)"
      >
        <span>공동구매 할인</span>
        <span class="font-bold">-{{ discountAmount.toLocaleString() }}원</span>
      </div>
      <div
        class="border-t border-(--color-border) pt-(--space-3) flex items-center justify-between"
      >
        <span
          class="text-(length:--font-base) font-bold text-(color:--color-navy)"
          >총 결제금액</span
        >
        <span
          class="text-(length:--font-lg) font-bold text-(color:--color-navy)"
        >
          {{ totalAmount.toLocaleString() }}원
        </span>
      </div>
    </section>

    <!-- 안내 문구 -->
    <p
      class="bg-(--color-surface) rounded-(--radius-md) p-(--space-4) text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed"
    >
      공동구매는 목표 인원 달성 시 확정되며, 미달 시 전액 환불됩니다.
    </p>

    <!-- 결제하기 버튼: 배송지 미등록 시 비활성화 -->
    <button
      type="button"
      :disabled="!shippingAddress"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) rounded-(--radius-md) text-(length:--font-base) font-bold shadow-(--shadow-md)"
      :class="
        shippingAddress
          ? 'bg-(--color-navy) text-(color:--color-white)'
          : 'bg-(--color-border) text-(color:--color-slate-muted) cursor-not-allowed'
      "
      @click="handlePayment"
    >
      {{ shippingAddress ? `${totalAmount.toLocaleString()}원 결제하기` : '배송지를 먼저 등록해주세요' }}
    </button>

    <!-- 배송지 변경 바텀시트 -->
    <BottomSheet v-model="isAddressSheetOpen" title="배송지 추가">
      <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-4)">
        상품을 받을 배송지를 입력해주세요
      </p>

      <div class="mb-(--space-4)">
        <label class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)">
          이름
        </label>
        <input
          v-model="addressForm.name"
          type="text"
          placeholder="홍길동"
          class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
        />
      </div>

      <div class="mb-(--space-4)">
        <label class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)">
          전화번호
        </label>
        <input
          v-model="addressForm.phone"
          type="tel"
          placeholder="010-1234-5678"
          class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
        />
      </div>

      <div class="mb-(--space-3)">
        <label class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)">
          우편번호
        </label>
        <div class="flex gap-(--space-2)">
          <input
            v-model="addressForm.postalCode"
            type="text"
            placeholder="12345"
            class="flex-1 min-w-0 h-[46px] px-(--space-4) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
          />
          <button
            type="button"
            class="shrink-0 w-20 h-[46px] bg-(--color-navy) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-xs) font-bold"
            @click="handleSearchAddress"
          >
            주소 찾기
          </button>
        </div>
      </div>

      <input
        v-model="addressForm.address"
        type="text"
        placeholder="주소"
        readonly
        class="w-full h-[46px] px-(--space-4) mb-(--space-3) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy)"
      />

      <input
        v-model="addressForm.addressDetail"
        type="text"
        placeholder="동, 호수 등 상세주소 입력"
        class="w-full h-[46px] px-(--space-4) mb-(--space-5) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
      />

      <div class="flex gap-(--space-3)">
        <button
          type="button"
          class="flex-1 h-[52px] bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) text-(length:--font-md) font-bold text-(color:--color-slate-dark)"
          @click="closeAddressSheet"
        >
          취소
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] bg-(--color-gold) rounded-(--radius-lg) text-(length:--font-md) font-bold text-(color:--color-navy)"
          @click="confirmAddress"
        >
          확인
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
