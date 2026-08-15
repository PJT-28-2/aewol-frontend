<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getBankMeta } from '@/utils/bankMeta';
import { formatCountdown } from '@/utils/date';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const route = useRoute();
const store = useAccountStore();
const nextQuery = computed(() => route.query.next === '/wallet/charge' ? { next: '/wallet/charge' } : {});

if (!store.linking.bankCode) {
  router.replace({ name: 'AccountLinkSelect', query: nextQuery.value });
}

const bankMeta = computed(() => getBankMeta(store.linking.bankCode));

// step 1: 계좌번호 입력 (Figma 목업에 없는 보완 단계)
// step 2: 1원 인증 - 입금자명(한글, CODEF inPrintType=1) 입력 (RF-CM 목업 그대로)
const step = ref('accountNumber');
// CODEF가 랜덤으로 만드는 한글 단어라 길이가 4~6자로 들쭉날쭉해요(2026-08-06 확인).
// verify-deposit 응답의 depositorNameLength를 그대로 신뢰해요. 아직 응답을
// 받기 전(컴포넌트 초기 렌더 시점)엔 store 기본값 4를 써요.
const depositorNameLength = computed(() => store.linking.depositorNameLength || 4);
const accountNumber = ref('');
const isRequesting = ref(false);
const requestError = ref('');

// 계좌번호는 숫자만 허용 (국내 계좌번호는 보통 10~16자리)
const ACCOUNT_NUMBER_MIN_LENGTH = 10;
const ACCOUNT_NUMBER_MAX_LENGTH = 16;

function onAccountNumberInput(event) {
  const digitsOnly = event.target.value.replace(/[^0-9]/g, '').slice(0, ACCOUNT_NUMBER_MAX_LENGTH);
  accountNumber.value = digitsOnly;
  event.target.value = digitsOnly;
}

const isAccountNumberValid = computed(
  () =>
    accountNumber.value.length >= ACCOUNT_NUMBER_MIN_LENGTH &&
    accountNumber.value.length <= ACCOUNT_NUMBER_MAX_LENGTH,
);

// 예금주명 입력 필드는 제거함(2026-08-06) — CODEF에 예금주명을 넘겨서 실제로
// 대조하는 게 아니라 사용자가 입력한 값을 그대로 저장만 하고 있어서 검증 효과가
// 없었어요. 화면 어디에도 표시되지 않는 값이라 입력 자체를 없앴어요
// (백엔드 DepositVerificationRequest.accountHolder 및 DB 컬럼도 함께 제거).

async function submitAccountNumber() {
  if (!isAccountNumberValid.value) {
    requestError.value = `계좌번호는 숫자 ${ACCOUNT_NUMBER_MIN_LENGTH}~${ACCOUNT_NUMBER_MAX_LENGTH}자리로 입력해주세요`;
    return;
  }
  isRequesting.value = true;
  requestError.value = '';
  try {
    await store.requestDepositAuth(accountNumber.value);
    step.value = 'depositorName';
    startTicking();
    await nextTick();
    focusHiddenInput();
  } catch (err) {
    // 3분 내 5회 요청 제한(2026-08-07) — 백엔드가 429로 내려주는 전용 메시지를 그대로 보여줘요.
    requestError.value =
      err?.response?.status === 429
        ? '1원 인증 요청이 너무 많아요. 잠시 후 다시 시도해주세요'
        : '계좌 확인에 실패했어요. 계좌번호를 다시 확인해주세요';
  } finally {
    isRequesting.value = false;
  }
}

// 입금자명 입력(한글, CODEF inPrintType=1) + 카운트다운
// 박스를 글자 수만큼 각각 input으로 만들면 한글 조합 도중 포커스가 다음 칸으로
// 넘어가면서 조합이 끊기는 문제가 있어서, 실제 입력은 hidden input 하나로만 받고
// 박스들은 그 문자열을 나눠서 보여주기만 하는 방식으로 처리해요.
const depositorInput = ref(''); // 확정된 값 (한글만, 최대 depositorNameLength자)
const composingPreview = ref(''); // 아직 조합 중인, 확정 전 글자의 실시간 미리보기
const hiddenInputRef = ref(null);
const isComposing = ref(false);
const isFocused = ref(false);
// 남은 시간은 store.linking.depositAuthExpiresAt(절대 만료 시각)를 기준으로 계산해요.
// setInterval로 세는 숫자를 직접 들고 있으면 화면을 나갔다 들어왔을 때(컴포넌트 재마운트)
// 그 사이 흐른 시간이 반영 안 돼서 부정확해져요(2026-08-07) — now만 1초마다 갱신하고
// 남은 시간은 항상 다시 계산해요.
const now = ref(Date.now());
let tickId = null;

function startTicking() {
  clearInterval(tickId);
  now.value = Date.now();
  tickId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
}

const remainingSeconds = computed(() =>
  Math.max(0, Math.round((store.linking.depositAuthExpiresAt - now.value) / 1000)),
);

// 확정된 글자 + (있다면) 조합 중인 미리보기 글자까지 합쳐서 화면에 보여줘요.
const digits = computed(() => {
  const chars = depositorInput.value.split('');
  if (composingPreview.value && chars.length < depositorNameLength.value) {
    chars.push(composingPreview.value);
  }
  return Array.from({ length: depositorNameLength.value }, (_, i) => chars[i] ?? '');
});

// 다음 글자가 들어갈(또는 지금 조합 중인) 박스 인덱스
const activeIndex = computed(() =>
  Math.min(depositorInput.value.length, depositorNameLength.value - 1),
);

function focusHiddenInput() {
  hiddenInputRef.value?.focus();
}

function filterHangul(value) {
  return value.replace(/[^가-힣]/g, '').slice(0, depositorNameLength.value);
}

function onCompositionStart() {
  isComposing.value = true;
}

function onCompositionEnd(event) {
  isComposing.value = false;
  composingPreview.value = '';
  const filtered = filterHangul(event.target.value);
  depositorInput.value = filtered;
  event.target.value = filtered;
}

function onDepositorInput(event) {
  if (isComposing.value) {
    // 아직 조합 중 — 확정하지 않고, 지금 조합 중인 글자만 실시간으로 미리 보여줘요.
    composingPreview.value = event.target.value.slice(depositorInput.value.length).slice(-1);
    return;
  }
  const filtered = filterHangul(event.target.value);
  depositorInput.value = filtered;
  event.target.value = filtered;
}

onMounted(() => {
  // 나갔다 들어왔을 때(컴포넌트 재마운트) 아직 유효한 인증이 진행 중이면(만료 전)
  // Step 1로 되돌리지 않고 Step 2부터 이어서 보여줘요 — 잠금 상태(store.linking.isConfirmLocked)도
  // store에 있어서 그대로 유지돼요(2026-08-07).
  if (store.linking.verificationId && store.linking.depositAuthExpiresAt > Date.now()) {
    step.value = 'depositorName';
    startTicking();
  }
});

onBeforeUnmount(() => clearInterval(tickId));

const timerLabel = computed(() => formatCountdown(remainingSeconds.value));

const isVerifyEnabled = computed(
  () =>
    depositorInput.value.length === depositorNameLength.value &&
    remainingSeconds.value > 0 &&
    !store.linking.isConfirmLocked,
);

const isVerifying = ref(false);
const verifyError = ref('');
const isResending = ref(false);
const resendError = ref('');

async function resendDeposit() {
  isResending.value = true;
  resendError.value = '';
  try {
    // 재마운트(나갔다 들어옴) 후에는 로컬 accountNumber가 빈 문자열로 초기화돼있어요.
    // store.linking.accountNumber는 requestDepositAuth 때 저장돼서 재마운트 후에도
    // 남아있으니 재전송은 항상 이 값을 써요(CodeRabbit 지적, 2026-08-07).
    await store.requestDepositAuth(store.linking.accountNumber);
    depositorInput.value = '';
    composingPreview.value = '';
    isComposing.value = false;
    if (hiddenInputRef.value) hiddenInputRef.value.value = '';
    verifyError.value = '';
    startTicking();
    await nextTick();
    focusHiddenInput();
  } catch (err) {
    // 3분 내 5회 요청 제한(2026-08-07) — 최초 요청과 동일한 카운터를 공유해요.
    resendError.value =
      err?.response?.status === 429
        ? '1원 인증 요청이 너무 많아요. 잠시 후 다시 시도해주세요'
        : '1원 재전송에 실패했어요. 다시 시도해주세요';
  } finally {
    isResending.value = false;
  }
}

async function submitVerification() {
  isVerifying.value = true;
  verifyError.value = '';
  try {
    const { verified, reason } = await store.confirmDepositAuth(depositorInput.value);
    if (!verified) {
      // 오답을 5번 넘게 넣으면 백엔드가 그 이후엔 정답을 넣어도 통과시키지 않아요
      // (2026-08-07) — 이 경우 "다시 확인해주세요"라고 하면 계속 틀렸다고 오해할
      // 수 있어서, 재전송이 필요하다는 걸 명확히 안내하고 입력 자체를 막아요.
      if (reason === 'TOO_MANY_ATTEMPTS') {
        // store.confirmDepositAuth 안에서 store.linking.isConfirmLocked = true로 이미 세팅됨
        verifyError.value = '인증 횟수를 초과했어요. 위 재전송 버튼으로 1원 인증을 다시 요청해주세요';
      } else {
        verifyError.value = '입금자명이 일치하지 않아요. 다시 확인해주세요';
      }
      return;
    }
    await store.completeAccountLink();
    // 간편 비밀번호는 계정당 하나만 설정하면 돼요. 이미 설정된 적이 있으면
    // (두 번째 계좌부터) 비밀번호 설정 단계를 건너뛰고 바로 완료 화면으로 보내요.
    if (store.hasSimplePassword) {
      router.replace({ name: 'AccountLinkComplete', query: nextQuery.value });
    } else {
      router.replace({ name: 'AccountPasswordSetup', query: nextQuery.value });
    }
  } catch {
    verifyError.value = '인증에 실패했어요. 다시 시도해주세요';
  } finally {
    isVerifying.value = false;
  }
}

</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-(--space-8)">
    <!-- Step 1: 계좌번호 입력 -->
    <template v-if="step === 'accountNumber'">
      <header class="mb-7">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
          계좌번호를 입력해주세요
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          {{ bankMeta.name }}에 1원을 보내 계좌를 확인할게요
        </p>
      </header>

      <div class="flex items-center gap-(--space-3) p-(--space-4) rounded-(--radius-xl) bg-(--color-white) border border-(--color-border) mb-(--space-5)">
        <BankBadge
          :bank-code="store.linking.bankCode"
          :size="36"
        />
        <span class="font-bold text-(color:--color-navy) text-(length:--font-base)">{{ bankMeta.name }}</span>
      </div>

      <input
        :value="accountNumber"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="계좌번호를 입력해주세요 (숫자만)"
        class="w-full p-(--space-4) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-(length:--font-base) text-(color:--color-navy) mb-(--space-2) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-leaf)"
        @input="onAccountNumberInput"
      >

      <p
        v-if="requestError"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-4)"
      >
        {{ requestError }}
      </p>

      <AppButton
        variant="primary"
        size="lg"
        block
        class="mt-(--space-4)"
        :disabled="!isAccountNumberValid || isRequesting"
        @click="submitAccountNumber"
      >
        {{ isRequesting ? '1원 보내는 중…' : '1원 인증 시작하기' }}
      </AppButton>
    </template>

    <!-- Step 2: 입금자명 4자리 입력 (RF-CM 목업) -->
    <template v-else>
      <header class="mb-(--space-6)">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
          입금된 1원의 {{ depositorNameLength }}글자<br>입금자명을 입력해주세요
        </h1>
      </header>

      <div class="flex items-center gap-(--space-3) p-(--space-4) rounded-(--radius-xl) bg-(--color-white) border border-(--color-border) mb-(--space-4)">
        <BankBadge
          :bank-code="store.linking.bankCode"
          :size="36"
        />
        <div>
          <p class="font-bold text-(color:--color-navy) text-(length:--font-base)">
            {{ bankMeta.name }}
          </p>
          <p class="text-(length:--font-sm) text-(color:--color-gray-500)">
            {{ store.linking.maskedAccountNumber }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-(--space-2) p-3.5 rounded-(--radius-lg) bg-(--color-surface) mb-(--space-6)">
        <IconLock
          :size="14"
          color="var(--color-slate-dark)"
        />
        <span class="text-(length:--font-sm) text-(color:--color-slate-dark)">{{ bankMeta.name }}으로 1원을 보냈어요</span>
      </div>

      <div class="flex items-center justify-between mb-(--space-4)">
        <span class="text-(length:--font-base) font-semibold text-(color:--color-navy)">입금자명 {{ depositorNameLength }}글자</span>
        <span
          v-if="remainingSeconds > 0 && !store.linking.isConfirmLocked"
          class="text-(length:--font-sm) font-semibold text-(color:--color-danger-strong)"
        >{{ timerLabel }}</span>
        <button
          v-else
          type="button"
          class="text-(length:--font-sm) font-semibold text-(color:--color-navy) underline underline-offset-2 disabled:opacity-50"
          :disabled="isResending"
          @click="resendDeposit"
        >
          {{ isResending ? '다시 보내는 중…' : '다시 보내기' }}
        </button>
      </div>
      <p
        v-if="resendError"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-2)"
      >
        {{ resendError }}
      </p>

      <div
        class="relative flex flex-wrap justify-center gap-(--space-3) mb-(--space-4)"
        :class="{ 'opacity-50': store.linking.isConfirmLocked }"
        @click="!store.linking.isConfirmLocked && focusHiddenInput()"
      >
        <input
          ref="hiddenInputRef"
          type="text"
          autocomplete="off"
          :disabled="store.linking.isConfirmLocked"
          :aria-label="`입금자명 인증 코드 ${depositorNameLength}글자 입력`"
          class="absolute inset-0 z-10 w-full h-full appearance-none border-0 p-0 m-0 opacity-0 cursor-text disabled:cursor-not-allowed"
          @input="onDepositorInput"
          @compositionstart="onCompositionStart"
          @compositionend="onCompositionEnd"
          @focus="isFocused = true"
          @blur="isFocused = false"
        >
        <div
          v-for="(digit, i) in digits"
          :key="i"
          class="pointer-events-none relative w-14 h-14 shrink-0 rounded-(--radius-lg) border-2 flex items-center justify-center text-center text-(length:--font-xl) font-bold text-(color:--color-navy)"
          :class="digit ? 'border-(--color-navy)' : 'border-(--color-border)'"
        >
          <span
            v-if="!digit && isFocused && i === activeIndex"
            class="w-0.5 h-6 bg-(--color-navy) animate-pulse"
          />
          <template v-else>
            {{ digit }}
          </template>
        </div>
      </div>

      <p class="text-(length:--font-sm) text-(color:--color-gray-500) leading-relaxed mb-(--space-2)">
        은행 앱 알림이나 입출금 문자에서<br>입금자명(예: 푸른애월)의 앞 {{ depositorNameLength }}글자를 확인할 수 있어요
      </p>
      <p
        v-if="verifyError"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-2)"
      >
        {{ verifyError }}
      </p>

      <AppButton
        variant="primary"
        size="lg"
        block
        class="mt-(--space-6)"
        :disabled="!isVerifyEnabled || isVerifying"
        @click="submitVerification"
      >
        {{ isVerifying ? '확인하는 중…' : '확인' }}
      </AppButton>
    </template>
  </div>
</template>
