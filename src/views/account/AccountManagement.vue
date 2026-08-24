<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getBankMeta } from '@/utils/bankMeta';
import AccountSummaryCard from '@/components/common/AccountSummaryCard.vue';
import AppButton from '@/components/common/AppButton.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusVisual from '@/components/common/StatusVisual.vue';

const router = useRouter();
const store = useAccountStore();

const showUnlinkSheet = ref(false);
const showUnlinkSuccess = ref(false);
const unlinkedAccountName = ref('');
const isUnlinking = ref(false);
const unlinkError = ref('');
const pendingAccount = ref(null);
const loadError = ref('');

async function loadAccounts() {
  loadError.value = '';
  try {
    await store.fetchAccounts();
  } catch {
    loadError.value = '계좌 목록을 불러오지 못했어요. 다시 시도해주세요';
  }
}

onMounted(() => {
  loadAccounts();
});

function openUnlink(account) {
  pendingAccount.value = account;
  unlinkError.value = '';
  store.openUnlinkConfirm(account);
  showUnlinkSheet.value = true;
}

// 해지 요청이 진행 중일 때는 바텀시트를 닫지 못하게 막아요.
// (진행 중에 취소/배경클릭으로 닫히면 pendingUnlinkAccount가 비워지면서
//  이미 나간 실제 요청과 상태가 어긋나 TypeError로 이어질 수 있어요.)
function closeUnlinkSheet() {
  if (isUnlinking.value) return;
  showUnlinkSheet.value = false;
  store.closeUnlinkConfirm();
  pendingAccount.value = null;
  unlinkError.value = '';
}

async function confirmUnlink() {
  if (!pendingAccount.value) return;
  isUnlinking.value = true;
  unlinkError.value = '';
  try {
    const accountName = getBankMeta(pendingAccount.value.bankCode).name;
    await store.confirmUnlink();
    unlinkedAccountName.value = accountName;
    showUnlinkSheet.value = false;
    pendingAccount.value = null;
    showUnlinkSuccess.value = true;
  } catch {
    unlinkError.value = '연동 해지에 실패했어요. 다시 시도해주세요';
  } finally {
    isUnlinking.value = false;
  }
}

function closeUnlinkSuccess() {
  showUnlinkSuccess.value = false;
}

function goToLink() {
  router.push({ name: 'AccountLinkSelect' });
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-(--space-8)">
    <!-- 완료 화면: 목록 위에 전체 화면으로 덮음 -->
    <div
      v-if="showUnlinkSuccess"
      class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-(--color-app-bg) px-(--space-6)"
    >
      <StatusVisual
        variant="success"
        class="mb-(--space-4)"
      />
      <h2 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        계좌 연동이 해지됐어요
      </h2>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) mb-(--space-8)">
        {{ unlinkedAccountName }} 계좌가 목록에서 제거됐어요
      </p>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="closeUnlinkSuccess"
      >
        확인
      </AppButton>
    </div>

    <template v-else>
      <header class="mb-7">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
          계좌 관리
        </h1>
      </header>

      <section class="mb-(--space-6)">
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-(--space-3)">
          연동된 계좌
        </h2>

        <div
          v-if="store.isLoading"
          class="py-(--space-8)"
        >
          <LoadingSpinner />
        </div>

        <div
          v-else-if="loadError"
          class="mb-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-center shadow-(--shadow-card)"
        >
          <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-3)">
            {{ loadError }}
          </p>
          <AppButton
            variant="primary"
            size="sm"
            @click="loadAccounts"
          >
            다시 시도
          </AppButton>
        </div>

        <p
          v-else-if="store.accounts.length === 0"
          class="text-(length:--font-sm) text-(color:--color-gray-500)"
        >
          아직 연동된 계좌가 없어요
        </p>

        <ul
          v-if="!store.isLoading && !loadError"
          class="flex flex-col gap-(--space-3)"
        >
          <li
            v-for="account in store.accounts"
            :key="account.accountId"
          >
            <AccountSummaryCard
              :bank-code="account.bankCode"
              :account-number-masked="account.accountNumberMasked"
              :is-primary="account.isPrimary"
              bordered
            >
              <template #action>
                <button
                  type="button"
                  class="shrink-0 px-(--space-3) py-(--space-1) rounded-(--radius-full) bg-(--color-white) border border-(--color-danger-soft) text-(length:--font-sm) text-(color:--color-danger-strong) font-semibold"
                  @click="openUnlink(account)"
                >
                  해지
                </button>
              </template>
            </AccountSummaryCard>
          </li>
        </ul>
      </section>

      <AppButton
        class="mb-(--space-6)"
        variant="primary"
        size="lg"
        block
        @click="goToLink"
      >
        + 계좌 연동하기
      </AppButton>

      <div class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
        <p class="text-(length:--font-sm) font-(--font-semibold) text-(color:--color-navy) mb-(--space-1)">
          계좌 데이터는 CODEF API를 통해 조회 전용으로 연동돼요
        </p>
        <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">
          실제 자금은 이동하지 않으며, 잔액 확인 목적에만 사용됩니다
        </p>
      </div>
    </template>

    <!-- 해지 확인 바텀시트 -->
    <BottomSheet
      :model-value="showUnlinkSheet"
      size="tall"
      @update:model-value="closeUnlinkSheet"
    >
      <div
        v-if="pendingAccount"
        class="flex flex-col items-center text-center"
      >
        <StatusVisual
          variant="danger"
          class="mt-(--space-5) mb-(--space-4)"
        />
        <h3 class="text-(length:--font-lg) font-bold text-(color:--color-navy) mb-(--space-2)">
          계좌 연동을 해지할까요?
        </h3>
        <p class="text-(length:--font-sm) text-(color:--color-slate-muted) mb-(--space-4)">
          해지 후에도 언제든 다시 연동할 수 있어요
        </p>

        <AccountSummaryCard
          :bank-code="pendingAccount.bankCode"
          :is-primary="pendingAccount.isPrimary"
          class="w-full mb-(--space-4)"
        />

        <ul class="w-full bg-(--color-danger-soft) rounded-(--radius-lg) p-(--space-4) flex flex-col gap-(--space-2) mb-(--space-5) text-left">
          <li class="flex items-center gap-(--space-2) text-(length:--font-sm) text-(color:--color-danger-muted)">
            <span class="w-[6px] h-[6px] rounded-full bg-(--color-danger-strong) shrink-0" />
            이 계좌가 포함된 응급 SOS 잔액 표시가 중단돼요
          </li>
          <li class="flex items-center gap-(--space-2) text-(length:--font-sm) text-(color:--color-danger-muted)">
            <span class="w-[6px] h-[6px] rounded-full bg-(--color-danger-strong) shrink-0" />
            거래 내역·자동 태깅 기록은 그대로 보관돼요
          </li>
          <li class="flex items-center gap-(--space-2) text-(length:--font-sm) text-(color:--color-danger-muted)">
            <span class="w-[6px] h-[6px] rounded-full bg-(--color-danger-strong) shrink-0" />
            다시 연동하면 잔액이 새로 조회돼요
          </li>
        </ul>

        <p
          v-if="unlinkError"
          class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-(--space-3)"
        >
          {{ unlinkError }}
        </p>

        <div class="grid grid-cols-2 gap-(--space-3) w-full">
          <button
            type="button"
            class="w-full h-[52px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) text-(color:--color-slate-dark) text-(length:--font-base) font-semibold"
            :disabled="isUnlinking"
            @click="closeUnlinkSheet"
          >
            취소
          </button>
          <AppButton
            variant="danger"
            size="lg"
            class="w-full"
            :disabled="isUnlinking"
            @click="confirmUnlink"
          >
            {{ isUnlinking ? '해지하는 중…' : '해지하기' }}
          </AppButton>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
