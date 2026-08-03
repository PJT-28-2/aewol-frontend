<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AddressSearchLayer from '@/components/common/AddressSearchLayer.vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import IconWarning from '@/components/common/icons/IconWarning.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PinAuthSheet from '@/components/common/PinAuthSheet.vue';
import { formatPhoneNumber as formatPhoneAsTyped } from '@/utils/phone';
import {
  MOCK_GROUP_PURCHASE_PAYMENT_PRODUCT,
  MOCK_GROUP_PURCHASE_PAYMENT_METHOD,
  MOCK_MEMBER_SHIPPING_ADDRESS,
} from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { memberApi } from '@/api/member';
import { useWalletStore } from '@/stores/wallet';

const route = useRoute();
const router = useRouter();
const walletStore = useWalletStore();

// 기본값은 회원 프로필의 배송지 — 사용자가 바꾸면(confirmAddress) 프로필이 아니라
// 이번 참여 건의 group_purchase_participant 레코드에만 저장됨(결제 시 handlePayment에서 join과 함께 전송)
const shippingAddress = ref(null);

// TODO: 공동구매 참여 화면에서 선택한 상품/가격 정보를 전달받을 예정, 현재는 mock 데이터
// 수량은 GroupPurchaseDetailView에서 query.quantity로 전달됨
const product = ref({
  ...MOCK_GROUP_PURCHASE_PAYMENT_PRODUCT,
  purchaseQuantity: Number(route.query.quantity) || 1,
});

// 지갑 잔액 — 결제수단(계좌) 자체는 아직 여러 개를 고를 수 없어 "애월 통합 지갑" 고정, 잔액만 walletApi로 조회
const paymentMethod = ref(null);
const isLoading = ref(true);
const isError = ref(false);

async function loadPaymentMethod() {
  isLoading.value = true;
  isError.value = false;
  try {
    if (USE_MOCK_DATA) {
      paymentMethod.value = { ...MOCK_GROUP_PURCHASE_PAYMENT_METHOD };
      shippingAddress.value = { ...MOCK_MEMBER_SHIPPING_ADDRESS };
      return;
    }

    const wallet = await walletStore.fetchWallet();
    paymentMethod.value = {
      name: '애월 통합 지갑',
      balance: wallet.totalBalance,
    };

    // member 프로필 필드명(name, phone, zipCode, address, addressDetail) 기준으로 매핑 — 실제 DTO 확인 필요
    const { data } = await memberApi.getProfile();
    const profile = data.result ?? data;
    if (profile?.address) {
      shippingAddress.value = {
        recipientName: profile.name,
        recipientPhone: profile.phone,
        zipCode: profile.zipCode,
        address: profile.address,
        addressDetail: profile.addressDetail,
      };
    }
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadPaymentMethod);

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
  isAddressSheetOpen.value = true;
}

const isPostcodeOpen = ref(false);

function handlePhoneInput(event) {
  addressForm.value.phone = formatPhoneAsTyped(event.target.value);
}

function handleAddressSelect({ zipCode, address }) {
  addressForm.value.zipCode = zipCode;
  addressForm.value.address = address;
  addressFormErrors.value.zipCode = '';
  addressFormErrors.value.address = '';
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

// 입력한 배송지로 교체 — 회원 프로필은 건드리지 않고 화면 상태만 갱신.
// 실제 저장은 결제 시 handlePayment의 join() 호출에 실려서 이번 참여 건의 참여자 레코드에만 반영됨
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

const isPaying = ref(false);
const paymentError = ref('');

// 참여 신청 · 결제가 한 번에 처리됨(비밀번호 인증 완료 후 호출)
async function handlePayment() {
  if (USE_MOCK_DATA) {
    router.push(`/group-purchase/${route.params.gpId}/status`);
    return;
  }

  paymentError.value = '';
  isPaying.value = true;
  try {
    // 수량은 quantity 쿼리 파라미터로 전달(백엔드가 현재 이것만 읽음).
    // 배송지는 group_purchase_participant 컬럼 기준으로 본문에 실어 보내지만,
    // 백엔드가 아직 본문을 처리하지 않아 실제로 저장되지는 않는다(백엔드 작업 필요)
    await groupPurchaseApi.join(route.params.gpId, product.value.purchaseQuantity, {
      recipientName: shippingAddress.value.recipientName,
      recipientPhone: shippingAddress.value.recipientPhone,
      zipCode: shippingAddress.value.zipCode,
      address: shippingAddress.value.address,
      addressDetail: shippingAddress.value.addressDetail,
    });
    router.push(`/group-purchase/${route.params.gpId}/status`);
  } catch {
    paymentError.value = '결제에 실패했어요. 다시 시도해주세요.';
  } finally {
    isPaying.value = false;
  }
}

function handleCharge() {
  router.push('/wallet/charge');
}

// 송금 비밀번호 인증 바텀시트
const isPinSheetOpen = ref(false);

// TODO: 사용자가 설정해둔 결제 비밀번호와 비교하는 로직 (DB 연동 전이라 현재는 비교 없이 통과)
// 지금은 6자리 입력이 완료되면 바로 결제 진행
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+88px)] bg-(--color-bg) min-h-screen"
  >
    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="flex justify-center py-(--space-9)"
    >
      <LoadingSpinner />
    </div>

    <!-- 에러 상태 -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center gap-(--space-4) py-(--space-9) px-(--space-4) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        결제 정보를 불러오지 못했어요
      </p>
      <AppButton
        variant="navy"
        @click="loadPaymentMethod"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else-if="paymentMethod">
      <!-- 헤더 -->
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-5)"
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
            <AppButton
              variant="ghost"
              size="sm"
              @click="handleChangeAddress"
            >
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
          <AppButton
            variant="secondary"
            block
            @click="handleChangeAddress"
          >
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
              ? 'bg-(--color-danger-soft) border-[1.5px] border-(--color-danger-strong)'
              : 'bg-(--color-white) border-2 border-(--color-navy)'
          "
        >
          <span
            class="inline-flex items-center justify-center w-10 h-6 rounded-(--radius-sm) bg-(--color-navy)"
          >
            <IconWallet
              :size="16"
              color="var(--color-white)"
            />
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
                ? 'font-bold text-(color:--color-danger-strong)'
                : 'text-(color:--color-gray-500)'
            "
          >
            잔액 {{ paymentMethod.balance.toLocaleString() }}원
          </p>
        </div>

        <!-- 잔액부족 경고 -->
        <div
          v-if="isBalanceInsufficient"
          class="mt-(--space-3) bg-(--color-danger-soft) rounded-(--radius-lg) p-(--space-4)"
        >
          <p
            class="flex items-center gap-(--space-1) text-(length:--font-sm) font-bold text-(color:--color-danger-strong)"
          >
            <IconWarning
              :size="14"
              color="var(--color-danger-strong)"
            />
            잔액이 부족해요
          </p>
          <p
            class="text-(length:--font-xs) text-(color:--color-danger-muted) mt-(--space-1)"
          >
            {{ shortfallAmount.toLocaleString() }}원을 충전하면 결제할 수 있어요
          </p>
        </div>
      </section>

      <!-- 결제 금액: 잔액부족 상태에서는 상세 내역 없이 총액만 표시 -->
      <section
        v-if="isBalanceInsufficient"
        class="mb-(--space-4)"
      >
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
      <section
        v-else
        class="mb-(--space-4)"
      >
        <h2
          class="text-(length:--font-sm) font-semibold text-(color:--color-slate-dark) mb-(--space-3)"
        >
          결제 금액
        </h2>
        <div
          class="flex items-center justify-between text-(length:--font-sm) text-(color:--color-slate-dark) mb-(--space-2)"
        >
          <span>상품 금액</span>
          <span class="text-(color:--color-navy)">{{ productAmount.toLocaleString() }}원</span>
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
          >총 결제금액</span>
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

      <!-- 결제 실패 안내 -->
      <p
        v-if="paymentError"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) text-center mb-(--space-3)"
      >
        {{ paymentError }}
      </p>

      <!-- 잔액부족: 충전하러 가기 버튼 -->
      <AppButton
        v-if="isBalanceInsufficient"
        variant="primary"
        size="lg"
        block
        class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) !w-auto shadow-(--shadow-md)"
        @click="handleCharge"
      >
        충전하러 가기
      </AppButton>

      <!-- 결제하기 버튼: 배송지 미등록 시 비활성화 -->
      <AppButton
        v-else
        variant="navy"
        size="lg"
        block
        :disabled="!shippingAddress"
        :loading="isPaying"
        class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) !w-auto !h-auto !min-h-(--control-height-lg) !py-(--space-3) text-center shadow-(--shadow-md)"
        @click="isPinSheetOpen = true"
      >
        {{
          shippingAddress
            ? `${totalAmount.toLocaleString()}원 결제하기`
            : '배송지를 먼저 등록해주세요'
        }}
      </AppButton>

      <!-- 배송지 변경 바텀시트 -->
      <BottomSheet
        v-model="isAddressSheetOpen"
        title="배송지 추가"
      >
        <p
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mb-(--space-4)"
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
                ? 'border-(--color-danger-strong)'
                : 'border-(--color-border)'
            "
          >
          <p
            v-if="addressFormErrors.name"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
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
            :value="addressForm.phone"
            type="tel"
            placeholder="010-1234-5678"
            class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
            :class="
              addressFormErrors.phone
                ? 'border-(--color-danger-strong)'
                : 'border-(--color-border)'
            "
            @input="handlePhoneInput"
          >
          <p
            v-if="addressFormErrors.phone"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
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
              placeholder="우편번호를 검색하세요"
              class="flex-1 min-w-0 h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
              :class="
                addressFormErrors.zipCode
                  ? 'border-(--color-danger-strong)'
                  : 'border-(--color-border)'
              "
            >
            <AppButton
              class="!h-[46px] !w-20 !rounded-(--radius-md) !px-0 shrink-0 whitespace-nowrap !text-[length:var(--font-xs)] !font-bold"
              variant="navy"
              type="button"
              @click="isPostcodeOpen = true"
            >
              우편번호 찾기
            </AppButton>
          </div>
          <p
            v-if="addressFormErrors.zipCode"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
          >
            {{ addressFormErrors.zipCode }}
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
            placeholder="우편번호 찾기를 눌러 입력해주세요"
            readonly
            class="w-full h-[46px] px-(--space-4) bg-(--color-surface) border rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-gray-500)"
            :class="
              addressFormErrors.address
                ? 'border-(--color-danger-strong)'
                : 'border-(--color-border)'
            "
          >
          <p
            v-if="addressFormErrors.address"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
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
                ? 'border-(--color-danger-strong)'
                : 'border-(--color-border)'
            "
          >
          <p
            v-if="addressFormErrors.addressDetail"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
          >
            {{ addressFormErrors.addressDetail }}
          </p>
        </div>

        <div class="flex gap-(--space-3)">
          <AppButton
            variant="secondary"
            size="lg"
            class="flex-1 border-(--color-border)!"
            @click="closeAddressSheet"
          >
            취소
          </AppButton>
          <AppButton
            variant="primary"
            size="lg"
            class="flex-1"
            @click="confirmAddress"
          >
            확인
          </AppButton>
        </div>
      </BottomSheet>

      <!-- 송금 비밀번호 인증 바텀시트 -->
      <PinAuthSheet
        v-model="isPinSheetOpen"
        :description="`${totalAmount.toLocaleString()}원을 안전하게 보내기 위해 확인해요`"
        @complete="handlePayment"
      />

      <AddressSearchLayer
        v-model="isPostcodeOpen"
        title="우편번호 찾기"
        @select="handleAddressSelect"
      />
    </template>
  </div>
</template>
