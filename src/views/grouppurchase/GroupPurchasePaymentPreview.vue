<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import IconWarning from '@/components/common/icons/IconWarning.vue';
import IconDelete from '@/components/common/icons/IconDelete.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import AppButton from '@/components/common/AppButton.vue';

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
  unitPrice: 40000,
  groupPrice: 28000,
});

// TODO: 등록된 결제 수단(계좌) 연동 예정, 현재는 mock 데이터
// 잔액부족 상태를 확인하기 위해 결제 금액(28,000원)보다 적은 잔액으로 설정
const paymentMethod = ref({
  name: '애월 통합 지갑',
  balance: 415000,
});

// 참여 화면에서 전달받은 수량 · 정가 · 할인가 기준으로 결제 금액 계산
const productAmount = computed(
  () => product.value.unitPrice * product.value.purchaseQuantity,
);
const discountAmount = computed(
  () =>
    (product.value.unitPrice - product.value.groupPrice) *
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
  zipCode: '',
  address: '',
  addressDetail: '',
});
const EMPTY_ADDRESS_FORM_ERRORS = {
  name: '',
  phone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
};
const addressFormErrors = ref({ ...EMPTY_ADDRESS_FORM_ERRORS });

function handleChangeAddress() {
  addressForm.value = {
    name: shippingAddress.value?.recipientName ?? '',
    phone: shippingAddress.value?.recipientPhone ?? '',
    zipCode: shippingAddress.value?.zipCode ?? '',
    address: shippingAddress.value?.address ?? '',
    addressDetail: shippingAddress.value?.addressDetail ?? '',
  };
  addressFormErrors.value = { ...EMPTY_ADDRESS_FORM_ERRORS };
  postcodeLoadError.value = '';
  isAddressSheetOpen.value = true;
}

// 카카오(다음) 우편번호 서비스 연동
const DAUM_POSTCODE_SCRIPT_SRC =
  '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const isPostcodeOpen = ref(false);
const postcodeContainerRef = ref(null);
const postcodeLoadError = ref('');

// 로딩 중인 스크립트 Promise를 캐싱 — DOM의 load/error 이벤트는 한 번만 발생하므로
// 이미 붙어있는 <script> 태그를 재검사하는 방식은 두 번째 호출부터 영원히 대기하게 됨
let daumPostcodeLoadPromise = null;

function loadDaumPostcodeScript() {
  if (window.daum?.Postcode) return Promise.resolve();

  if (!daumPostcodeLoadPromise) {
    daumPostcodeLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = DAUM_POSTCODE_SCRIPT_SRC;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        reject(new Error('우편번호 서비스를 불러오지 못했습니다'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      // 실패 시 캐시를 비워 다음 시도에서 스크립트를 다시 붙일 수 있게 함
      daumPostcodeLoadPromise = null;
      throw error;
    });
  }

  return daumPostcodeLoadPromise;
}

// 우편번호 찾기 레이어를 열고 카카오 우편번호 서비스를 그 안에 임베드
async function handleSearchAddress() {
  postcodeLoadError.value = '';

  try {
    await loadDaumPostcodeScript();
  } catch {
    postcodeLoadError.value = '우편번호 서비스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
    return;
  }

  isPostcodeOpen.value = true;
  await nextTick();

  // embed()는 컨테이너에 append만 하므로, 재오픈 시 이전 위젯이 중첩되지 않도록 먼저 비움
  postcodeContainerRef.value.replaceChildren();

  new window.daum.Postcode({
    oncomplete(data) {
      addressForm.value.zipCode = data.zonecode;
      addressForm.value.address = data.roadAddress || data.jibunAddress;
      addressFormErrors.value.zipCode = '';
      addressFormErrors.value.address = '';
      isPostcodeOpen.value = false;
    },
  }).embed(postcodeContainerRef.value);
}

function closePostcode() {
  isPostcodeOpen.value = false;
}

function closeAddressSheet() {
  isAddressSheetOpen.value = false;
}

// 하이픈 유무와 무관하게 검증할 수 있도록 숫자만 추출
function normalizePhoneDigits(value) {
  return value.replace(/\D/g, '');
}

function formatPhoneNumber(digits) {
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// 필드별 빈 값·형식 검증, 통과 여부를 반환하고 오류 메시지를 채움
function validateAddressForm() {
  const form = addressForm.value;
  const errors = { ...EMPTY_ADDRESS_FORM_ERRORS };

  if (!form.name.trim()) {
    errors.name = '이름을 입력해주세요';
  }

  const phoneDigits = normalizePhoneDigits(form.phone);
  if (!form.phone.trim()) {
    errors.phone = '전화번호를 입력해주세요';
  } else if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) {
    errors.phone = '전화번호 형식이 올바르지 않아요 (예: 010-1234-5678)';
  } else {
    // 하이픈 없이 입력해도 저장 형식은 통일
    form.phone = formatPhoneNumber(phoneDigits);
  }

  if (!form.zipCode.trim()) {
    errors.zipCode = '우편번호를 입력해주세요';
  } else if (!/^\d{5}$/.test(form.zipCode.trim())) {
    errors.zipCode = '우편번호 5자리를 확인해주세요';
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
    zipCode: addressForm.value.zipCode,
    address: addressForm.value.address,
    addressDetail: addressForm.value.addressDetail,
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
          <AppButton variant="ghost" size="sm" @click="handleChangeAddress">
            변경
          </AppButton>
        </div>
        <p class="text-(length:--font-md) font-bold text-(color:--color-navy)">
          {{ shippingAddress.recipientName }}
          {{ shippingAddress.recipientPhone }}
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-1)"
        >
          {{ shippingAddress.address }}, {{ shippingAddress.addressDetail }}
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
        <AppButton variant="secondary" block @click="handleChangeAddress">
          + 배송지 추가하기
        </AppButton>
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
          class="flex items-center gap-(--space-1) text-(length:--font-sm) font-bold text-(color:--color-danger-border)"
        >
          <IconWarning :size="14" color="var(--color-danger-border)" />
          잔액이 부족해요
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
    <AppButton
      v-if="isBalanceInsufficient"
      variant="primary"
      size="lg"
      block
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) shadow-(--shadow-md)"
      @click="handleCharge"
    >
      충전하러 가기
    </AppButton>

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
            v-model="addressForm.zipCode"
            type="text"
            placeholder="12345"
            class="flex-1 min-w-0 h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
            :class="
              addressFormErrors.zipCode
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
          v-if="addressFormErrors.zipCode"
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.zipCode }}
        </p>
        <p
          v-if="postcodeLoadError"
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ postcodeLoadError }}
        </p>
      </div>

      <div class="mb-(--space-3)">
        <label
          class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
        >
          주소
        </label>
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
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.address }}
        </p>
      </div>

      <div class="mb-(--space-5)">
        <label
          class="block text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-2)"
        >
          상세주소
        </label>
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
          class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
        >
          {{ addressFormErrors.addressDetail }}
        </p>
      </div>

      <div class="flex gap-(--space-3)">
        <AppButton variant="secondary" size="lg" class="flex-1" @click="closeAddressSheet">
          취소
        </AppButton>
        <AppButton variant="primary" size="lg" class="flex-1" @click="confirmAddress">
          확인
        </AppButton>
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
      </div>

      <div class="grid grid-cols-3 gap-(--space-4) mt-(--space-7)">
        <template v-for="key in keypadKeys" :key="key || 'blank'">
          <div v-if="key === ''" class="h-14" aria-hidden="true" />
          <button
            v-else
            type="button"
            class="h-14 flex items-center justify-center text-(length:--font-2xl) font-bold text-(color:--color-navy)"
            :aria-label="key === '⌫' ? '지우기' : key"
            @click="key === '⌫' ? handlePinBackspace() : handlePinKeyPress(key)"
          >
            <IconDelete v-if="key === '⌫'" :size="20" color="var(--color-navy)" aria-hidden="true" />
            <template v-else>{{ key }}</template>
          </button>
        </template>
      </div>
    </BottomSheet>

    <!-- 카카오 우편번호 검색 레이어 -->
    <Teleport to="body">
      <div
        v-if="isPostcodeOpen"
        class="fixed inset-0 z-1000 bg-(--color-white) flex flex-col"
      >
        <div class="flex items-center justify-between p-(--space-4) border-b border-(--color-border)">
          <span class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
            주소 검색
          </span>
          <AppButton variant="ghost" size="sm" @click="closePostcode">닫기</AppButton>
        </div>
        <div ref="postcodeContainerRef" class="flex-1" />
      </div>
    </Teleport>
  </div>
</template>
