<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BankBadge from '@/components/common/BankBadge.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import { useAccountStore } from '@/stores/account';
import { formatWon, getBankMeta } from '@/utils/bankMeta';
import { ENABLED_BANK_CODES, MOCK_ACCOUNTS, MOCK_BANKS } from '@/mocks/account';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();

onMounted(async () => {
  if (accountStore.accounts.length) return;
  try {
    await accountStore.fetchAccounts();
  } catch {
    // 계좌 연동 API 연동 전이라 조회가 실패할 수 있어요. 내 계좌는 최소 하나 보이도록 폴백
  }
  if (!accountStore.accounts.length) {
    accountStore.accounts = structuredClone(MOCK_ACCOUNTS);
  }
});

// 실제 송금 가능한 은행은 KB/토스뿐이라 받는 은행 선택지도 동일하게 제한
const receivingBanks = MOCK_BANKS.filter((bank) =>
  ENABLED_BANK_CODES.includes(bank.bankCode),
);

const receivingBankCode = ref(
  route.query.bankCode || receivingBanks[0]?.bankCode || '',
);
const receivingAccountNumber = ref(route.query.accountNumber || '');

const receivingBankName = computed(
  () => receivingBanks.find((bank) => bank.bankCode === receivingBankCode.value)?.bankName,
);

const isBankSheetOpen = ref(false);

function selectReceivingBank(bank) {
  receivingBankCode.value = bank.bankCode;
  isBankSheetOpen.value = false;
}

const quickAmounts = [10000, 30000, 50000, 100000];
const amount = ref(Number(route.query.amount) || 0);

function addAmount(value) {
  amount.value += value;
}

const myAccount = computed(() => {
  const queryId = Number(route.query.myAccountId);
  return (
    accountStore.accounts.find((account) => account.accountId === queryId) ??
    accountStore.primaryAccount ??
    accountStore.accounts[0] ??
    null
  );
});

const myAccountBankMeta = computed(() =>
  myAccount.value ? getBankMeta(myAccount.value.bankCode) : null,
);

const isInsufficientBalance = computed(
  () => !!myAccount.value && amount.value > myAccount.value.balance,
);

const canProceed = computed(
  () =>
    !!receivingBankCode.value &&
    !!receivingAccountNumber.value.trim() &&
    amount.value > 0 &&
    !!myAccount.value &&
    !isInsufficientBalance.value,
);

function currentQuery() {
  return {
    bankCode: receivingBankCode.value,
    accountNumber: receivingAccountNumber.value,
    amount: amount.value,
    myAccountId: myAccount.value?.accountId,
  };
}

function goToMyAccountSelect() {
  router.push({
    path: '/wallet/transfer/account-select',
    query: currentQuery(),
  });
}

function handleNext() {
  if (!canProceed.value) return;
  router.push({
    path: '/wallet/transfer/confirm',
    query: currentQuery(),
  });
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen"
  >
    <header class="mb-(--space-5)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        얼마를 보낼까요?
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        받는 계좌로 보낼 금액을 입력해주세요
      </p>
    </header>

    <section class="mb-(--space-4)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        받는 은행
      </h2>
      <button
        type="button"
        class="w-full flex items-center justify-between p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) font-semibold text-(color:--color-navy)"
        @click="isBankSheetOpen = true"
      >
        {{ receivingBankName }}
        <IconChevronDown
          size="16"
          color="var(--color-slate-muted)"
        />
      </button>
    </section>

    <section class="mb-(--space-6)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        계좌번호
      </h2>
      <input
        v-model="receivingAccountNumber"
        type="text"
        inputmode="numeric"
        placeholder="123456-12-123456"
        class="w-full p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none"
      >
    </section>

    <p
      class="text-center text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-4)"
    >
      {{ amount.toLocaleString() }}원
    </p>

    <div class="grid grid-cols-4 gap-(--space-2) mb-(--space-6)">
      <button
        v-for="value in quickAmounts"
        :key="value"
        type="button"
        class="h-[36px] rounded-[10px] border border-(--color-border) text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
        @click="addAmount(value)"
      >
        +{{ value / 10000 }}만원
      </button>
    </div>

    <section class="mb-(--space-6)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-3)"
      >
        내 계좌
      </h2>
      <button
        v-if="myAccount"
        type="button"
        class="w-full flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-icon) p-(--space-4)"
        @click="goToMyAccountSelect"
      >
        <BankBadge
          :bank-code="myAccount.bankCode"
          :size="40"
        />
        <div class="flex-1 text-left">
          <p
            class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
          >
            {{ myAccountBankMeta.name }}
          </p>
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            {{ myAccount.accountNumberMasked }} · {{ formatWon(myAccount.balance) }}
          </p>
        </div>
        <span
          class="text-(length:--font-xl) text-(color:--color-gray-400)"
        >&rsaquo;</span>
      </button>
      <p
        v-if="isInsufficientBalance"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mt-(--space-2)"
      >
        잔액이 부족해요
      </p>
    </section>

    <AppButton
      variant="primary"
      size="lg"
      :disabled="!canProceed"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) rounded-(--radius-xl) shadow-(--shadow-md)"
      @click="handleNext"
    >
      다음
    </AppButton>

    <BottomSheet
      v-model="isBankSheetOpen"
      title="받는 은행 선택"
    >
      <ul>
        <li
          v-for="bank in receivingBanks"
          :key="bank.bankCode"
        >
          <button
            type="button"
            class="w-full flex items-center gap-(--space-3) py-(--space-3)"
            @click="selectReceivingBank(bank)"
          >
            <BankBadge
              :bank-code="bank.bankCode"
              :size="32"
            />
            <span
              class="flex-1 text-left text-(length:--font-base)"
              :class="
                bank.bankCode === receivingBankCode
                  ? 'text-(color:--color-gold) font-bold'
                  : 'text-(color:--color-slate-dark)'
              "
            >
              {{ bank.bankName }}
            </span>
            <IconCheck
              v-if="bank.bankCode === receivingBankCode"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
