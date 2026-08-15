<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import PinKeypad from '@/components/common/PinKeypad.vue';
import PinDots from '@/components/common/PinDots.vue';
import IconLock from '@/components/common/icons/IconLock.vue';

const router = useRouter();
const route = useRoute();
const store = useAccountStore();
const nextQuery = route.query.next === '/wallet/charge' ? { next: '/wallet/charge' } : {};

if (!store.linking.verificationId) {
  router.replace({ name: 'AccountLinkSelect', query: nextQuery });
}

const pin = ref('');
const pinError = ref('');

// 송금·이체에 쓰이는 비밀번호라 최소한 이 정도는 막아요(2026-08-11 보강 — 백엔드
// MemberServiceImpl과 동일한 규칙/문구로 맞춰둠, 둘 중 하나만 고치지 않게 주의).
// 원인별로 다른 안내 문구를 보여주기 위해 'sequential'(연속 숫자)과 'weak'(그 외 취약
// 패턴)를 구분해서 반환한다. 둘 다 아니면 null.
// - sequential: 연속된 숫자 3자리 이상(123, 987) — PIN 전체가 아니라 중간에 섞여 있어도
//   막아요(예: 451236은 뒤쪽 "123"이 걸림). 9 다음 0으로 넘어가는 890, 901 같은 순환 구간도 포함.
// - weak: 전부 같은 숫자(111111) / 두 자리 반복(121212) / 세 자리 반복(123123) /
//   두 자리씩 짝지어 오름차순·내림차순으로 이어지는 경우(112233, 998877)
function getPinWeaknessReason(value) {
  if (hasSequentialRun(value, 3)) return 'sequential';

  if (
    /^(\d)\1{5}$/.test(value) ||
    /^(\d{2})\1{2}$/.test(value) ||
    /^(\d{3})\1$/.test(value) ||
    hasAscendingOrDescendingPairs(value)
  ) {
    return 'weak';
  }

  return null;
}

// value 안에서 오름차순/내림차순으로 minLength자리 이상 이어지는 구간이 있으면 true.
// 0↔9 경계도 순환으로 취급한다(9 다음 0, 0 다음 9).
function hasSequentialRun(value, minLength) {
  let ascRun = 1;
  let descRun = 1;
  for (let i = 1; i < value.length; i++) {
    const prev = Number(value[i - 1]);
    const curr = Number(value[i]);

    ascRun = (prev + 1) % 10 === curr ? ascRun + 1 : 1;
    descRun = (prev - 1 + 10) % 10 === curr ? descRun + 1 : 1;

    if (ascRun >= minLength || descRun >= minLength) return true;
  }
  return false;
}

function hasAscendingOrDescendingPairs(value) {
  const pairDigits = [];
  for (let i = 0; i < value.length; i += 2) {
    if (value[i] !== value[i + 1]) return false;
    pairDigits.push(Number(value[i]));
  }
  if (pairDigits.length !== 3) return false;
  const step1 = pairDigits[1] - pairDigits[0];
  const step2 = pairDigits[2] - pairDigits[1];
  return step1 === step2 && Math.abs(step1) === 1;
}

function handleComplete(value) {
  const reason = getPinWeaknessReason(value);
  if (reason === 'sequential') {
    pinError.value = '연속된 숫자예요. 다른 비밀번호를 입력해주세요';
    pin.value = '';
    return;
  }
  if (reason === 'weak') {
    pinError.value = '유추하기 쉬운 숫자예요. 다른 비밀번호를 입력해주세요';
    pin.value = '';
    return;
  }
  store.setPendingPassword(value);
  router.push({ name: 'AccountPasswordConfirm', query: nextQuery });
}

// 생체인증 등록/전환은 별도 기능이라 아직 실제 동작은 없어요 — 디자인에 맞춰 진입점만
// 두고, 눌렀을 때는 준비 중 안내만 보여줘요.
const showBiometricNotice = ref(false);
function handleBiometricSwitch() {
  showBiometricNotice.value = true;
}
</script>

<template>
  <div class="min-h-[calc(100svh-var(--header-height))] flex flex-col bg-(--color-app-bg)">
    <div class="mx-auto w-full max-w-(--content-max-width) px-(--space-5) pt-(--space-7) text-center">
      <header class="mb-(--space-4)">
        <span class="mx-auto mb-(--space-4) flex size-[52px] items-center justify-center rounded-[18px] bg-(--color-leaf-soft)">
          <IconLock
            :size="22"
            color="var(--color-leaf-dark)"
          />
        </span>
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug">
          간편 비밀번호를 설정해주세요
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          결제할 때 사용할 숫자 6자리를 입력해주세요
        </p>
      </header>

      <PinDots
        :model-value="pin"
        :length="6"
      />

      <div
        v-if="pinError"
        class="rounded-(--radius-lg) p-(--space-3) mt-(--space-6) text-center bg-(--color-danger-soft)"
      >
        <p class="text-(length:--font-sm) text-(color:--color-danger-muted)">
          {{ pinError }}
        </p>
      </div>
    </div>

    <div class="mx-auto mt-auto w-full max-w-(--content-max-width) rounded-t-[32px] border-x border-t border-(--color-card-border) bg-(--color-leaf-soft) px-(--space-7) pt-(--space-5) pb-(--space-7) shadow-[0_-10px_30px_color-mix(in_srgb,var(--color-navy)_6%,transparent)]">
      <PinKeypad
        v-model="pin"
        @complete="handleComplete"
      />

      <button
        type="button"
        class="mx-auto mt-(--space-5) flex items-center gap-(--space-2) rounded-full bg-(--color-white) px-(--space-4) py-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
        @click="handleBiometricSwitch"
      >
        <IconLock
          :size="14"
          color="var(--color-leaf-dark)"
        />
        생체인증으로 전환
      </button>
      <p
        v-if="showBiometricNotice"
        class="mt-(--space-2) text-center text-(length:--font-xs) text-(color:--color-navy)"
      >
        생체인증은 준비 중이에요. 조금만 기다려주세요
      </p>
    </div>
  </div>
</template>
