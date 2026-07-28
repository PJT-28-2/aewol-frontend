<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';

const route = useRoute();
const router = useRouter();

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
// 잔액부족 상태를 확인하기 위해 결제 금액(28,000원)보다 적은 잔액으로 설정
const paymentMethod = ref({
  name: '애월 통합 지갑',
  balance: 415000,
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

// 지갑 잔액이 결제 금액보다 부족한지 여부 (배송지 섹션 숨김, 결제수단 경고 스타일, CTA "충전하러 가기"로 분기)
const isBalanceInsufficient = computed(
  () => paymentMethod.value.balance < totalAmount.value,
);
const shortfallAmount = computed(
  () => totalAmount.value - paymentMethod.value.balance,
);

// 배송지 변경 바텀시트 상태 및 입력 폼 (현재 배송지 값으로 초기화)
const isAddressSheetOpen = ref(false);
const addressForm = ref({
  name: '',
  phone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
});
const EMPTY_ADDRESS_FORM_ERRORS = {
  name: '',
  phone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
};
const addressFormErrors = ref({ ...EMPTY_ADDRESS_FORM_ERRORS });

function handleChangeAddress() {
  addressForm.value = {
    name: shippingAddress.value?.recipientName ?? '',
    phone: shippingAddress.value?.recipientPhone ?? '',
    postalCode: '',
    address: shippingAddress.value?.address ?? '',
    addressDetail: '',
  };
  addressFormErrors.value = { ...EMPTY_ADDRESS_FORM_ERRORS };
  isAddressSheetOpen.value = true;
}

// TODO: 실제 우편번호(주소 검색) API 연동 예정, 현재는 mock 값으로 채움
function handleSearchAddress() {
  addressForm.value.postalCode = '12345';
  addressForm.value.address = '서울특별시 광진구 화양동';
  addressFormErrors.value.postalCode = '';
  addressFormErrors.value.address = '';
}

function closeAddressSheet() {
  isAddressSheetOpen.value = false;
}

// 필드별 빈 값·형식 검증, 통과 여부를 반환하고 오류 메시지를 채움
function validateAddressForm() {
  const form = addressForm.value;
  const errors = { ...EMPTY_ADDRESS_FORM_ERRORS };

  if (!form.name.trim()) {
    errors.name = '이름을 입력해주세요';
  }

  if (!form.phone.trim()) {
    errors.phone = '전화번호를 입력해주세요';
  } else if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(form.phone.trim())) {
    errors.phone = '전화번호 형식이 올바르지 않아요 (예: 010-1234-5678)';
  }

  if (!form.postalCode.trim()) {
    errors.postalCode = '우편번호를 입력해주세요';
  } else if (!/^\d{5}$/.test(form.postalCode.trim())) {
    errors.postalCode = '우편번호 5자리를 확인해주세요';
  }

  if (!form.address.trim()) {
    errors.address = '주소 찾기로 주소를 입력해주세요';
  }

  if (!form.addressDetail.trim()) {
    errors.addressDetail = '상세주소를 입력해주세요';
  }

  addressFormErrors.value = errors;

  return Object.values(errors).every((message) => !message);
}

// 입력한 배송지로 교체 (현재는 화면 상태만 갱신, DB 저장은 추후 연동)
function confirmAddress() {
  if (!validateAddressForm()) return;

  shippingAddress.value = {
    recipientName: addressForm.value.name,
    recipientPhone: addressForm.value.phone,
    address: `${addressForm.value.address}, ${addressForm.value.addressDetail}`,
  };
  isAddressSheetOpen.value = false;
}

// TODO: POST /api/group-purchase/{gp_id}/payments 연동 예정 (비밀번호 인증 완료 후 호출)
function handlePayment() {
  // 결제 완료 후 이동할 상태 확인 화면 (GroupPurchaseStatusView.vue, 아직 미구현)
  router.push(`/group-purchase/${route.params.gpId}/status`);
}

// 충전 페이지 라우팅은 아직 미구현 — 버튼만 배치
function handleCharge() {
  // TODO: /wallet/charge 라우팅 연동 예정
}

// 송금 비밀번호 인증 바텀시트
const PIN_LENGTH = 6;
const pinInput = ref('');
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const isPinSheetOpen = ref(false);

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

// TODO: 사용자가 설정해둔 결제 비밀번호와 비교하는 로직 (DB 연동 전이라 현재는 비교 없이 통과)
// const isPasswordValid = pinInput.value === savedPaymentPassword;
// if (!isPasswordValid) { ...비밀번호 불일치 처리... ; return; }
// 지금은 6자리 입력이 완료되면 바로 결제 진행
function handlePinComplete() {
  closePinSheet();
  handlePayment();
}

// TODO: 생체인증 전환 연동 예정
function handleSwitchToBiometric() {}
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

    <!-- 배송지: 잔액부족 상태에서는 표시하지 않음 -->
    <section
      v-if="!isBalanceInsufficient"
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
          {{ shippingAddress.recipientName }}
          {{ shippingAddress.recipientPhone }}
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
        class="flex items-center gap-(--space-3) rounded-(--radius-lg) p-(--space-4)"
        :class="
          isBalanceInsufficient
            ? 'bg-(--color-danger-bg) border-[1.5px] border-(--color-danger-border)'
            : 'bg-(--color-white) border-2 border-(--color-navy)'
        "
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
          class="shrink-0 text-(length:--font-xs)"
          :class="
            isBalanceInsufficient
              ? 'font-bold text-(color:--color-danger-border)'
              : 'text-(color:--color-gray-500)'
          "
        >
          잔액 {{ paymentMethod.balance.toLocaleString() }}원
        </p>
      </div>

      <!-- 잔액부족 경고 -->
      <div
        v-if="isBalanceInsufficient"
        class="mt-(--space-3) bg-(--color-danger-bg) rounded-(--radius-lg) p-(--space-4)"
      >
        <p
          class="text-(length:--font-sm) font-bold text-(color:--color-danger-border)"
        >
          ⚠️ 잔액이 부족해요
        </p>
        <p
          class="text-(length:--font-xs) text-(color:--color-danger-text) mt-(--space-1)"
        >
          {{ shortfallAmount.toLocaleString() }}원을 충전하면 결제할 수 있어요
        </p>
      </div>
    </section>

    <!-- 결제 금액: 잔액부족 상태에서는 상세 내역 없이 총액만 표시 -->
    <section v-if="isBalanceInsufficient" class="mb-(--space-4)">
      <div class="flex items-center justify-between">
        <span
          class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
        >
          결제 금액
        </span>
        <span
          class="text-(length:--font-lg) font-bold text-(color:--color-navy)"
        >
          {{ totalAmount.toLocaleString() }}원
        </span>
      </div>
    </section>
    <section v-else class="mb-(--space-4)">
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

    <!-- 안내 문구: 잔액부족 상태에서는 표시하지 않음 -->
    <p
      v-if="!isBalanceInsufficient"
      class="bg-(--color-surface) rounded-(--radius-md) p-(--space-4) text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed"
    >
      공동구매는 목표 인원 달성 시 확정되며, 미달 시 전액 환불됩니다.
    </p>

    <!-- 잔액부족: 충전하러 가기 버튼 -->
    <button
      v-if="isBalanceInsufficient"
      type="button"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) bg-(--color-gold) text-(color:--color-navy) rounded-(--radius-md) text-(length:--font-base) font-bold shadow-(--shadow-md)"
      @click="handleCharge"
    >
      충전하러 가기
    </button>

    <!-- 결제하기 버튼: 배송지 미등록 시 비활성화 -->
    <button
      v-else
      type="button"
      :disabled="!shippingAddress"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) rounded-(--radius-md) text-(length:--font-base) font-bold shadow-(--shadow-md)"
      :class="
        shippingAddress
          ? 'bg-(--color-navy) text-(color:--color-white)'
          : 'bg-(--color-border) text-(color:--color-slate-muted) cursor-not-allowed'
      "
      @click="openPinSheet"
    >
      {{
        shippingAddress
          ? `${totalAmount.toLocaleString()}원 결제하기`
          : '배송지를 먼저 등록해주세요'
      }}
    </button>

    <!-- 배송지 변경 바텀시트 -->
    <BottomSheet v-model="isAddressSheetOpen" title="배송지 추가">
      <p
        class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-4)"
      >
        상품을 받을 배송지를 입력해주세요
      </p>

      <div class="mb-(--space-4)">
        <label
          class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
        >
          이름
        </label>
        <input
          v-model="addressForm.name"
          type="text"
          placeholder="홍길동"
          class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
          :class="
            addressFormErrors.name
              ? 'border-(--color-danger)'
              : 'border-(--color-border)'
          "
        />
        <p
          v-if="addressFormErrors.name"
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.name }}
        </p>
      </div>

      <div class="mb-(--space-4)">
        <label
          class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
        >
          전화번호
        </label>
        <input
          v-model="addressForm.phone"
          type="tel"
          placeholder="010-1234-5678"
          class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
          :class="
            addressFormErrors.phone
              ? 'border-(--color-danger)'
              : 'border-(--color-border)'
          "
        />
        <p
          v-if="addressFormErrors.phone"
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.phone }}
        </p>
      </div>

      <div class="mb-(--space-3)">
        <label
          class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
        >
          우편번호
        </label>
        <div class="flex gap-(--space-2)">
          <input
            v-model="addressForm.postalCode"
            type="text"
            placeholder="12345"
            class="flex-1 min-w-0 h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
            :class="
              addressFormErrors.postalCode
                ? 'border-(--color-danger)'
                : 'border-(--color-border)'
            "
          />
          <button
            type="button"
            class="shrink-0 w-20 h-[46px] bg-(--color-navy) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-xs) font-bold"
            @click="handleSearchAddress"
          >
            주소 찾기
          </button>
        </div>
        <p
          v-if="addressFormErrors.postalCode"
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.postalCode }}
        </p>
      </div>

      <input
        v-model="addressForm.address"
        type="text"
        placeholder="주소"
        readonly
        class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy)"
        :class="
          addressFormErrors.address
            ? 'border-(--color-danger)'
            : 'border-(--color-border)'
        "
      />
      <p
        v-if="addressFormErrors.address"
        class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1) mb-(--space-3)"
      >
        {{ addressFormErrors.address }}
      </p>
      <div v-else class="mb-(--space-3)" />

      <input
        v-model="addressForm.addressDetail"
        type="text"
        placeholder="동, 호수 등 상세주소 입력"
        class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
        :class="
          addressFormErrors.addressDetail
            ? 'border-(--color-danger)'
            : 'border-(--color-border)'
        "
      />
      <p
        v-if="addressFormErrors.addressDetail"
        class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1) mb-(--space-5)"
      >
        {{ addressFormErrors.addressDetail }}
      </p>
      <div v-else class="mb-(--space-5)" />

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

    <!-- 송금 비밀번호 인증 바텀시트 -->
    <BottomSheet v-model="isPinSheetOpen">
      <div class="text-center">
        <h2 class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
          비밀번호를 입력해주세요
        </h2>
        <p class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2)">
          {{ totalAmount.toLocaleString() }}원을 안전하게 보내기 위해 확인해요
        </p>

        <div class="flex items-center justify-center gap-(--space-2) mt-(--space-6)">
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

        <button
          type="button"
          class="mt-(--space-6) text-(length:--font-sm) font-bold text-(color:--color-slate-dark)"
          @click="handleSwitchToBiometric"
        >
          🔒 생체인증으로 전환
        </button>
      </div>

      <div class="grid grid-cols-3 gap-(--space-4) mt-(--space-7)">
        <button
          v-for="key in keypadKeys"
          :key="key || 'blank'"
          type="button"
          :disabled="key === ''"
          class="h-14 flex items-center justify-center text-(length:--font-2xl) font-bold text-(color:--color-navy)"
          :class="{ invisible: key === '' }"
          @click="key === '⌫' ? handlePinBackspace() : handlePinKeyPress(key)"
        >
          {{ key }}
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
