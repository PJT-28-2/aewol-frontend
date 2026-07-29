<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getBankMeta, formatWon } from '@/utils/bankMeta';
import BankBadge from '@/components/common/BankBadge.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import IconLock from '@/components/common/icons/IconLock.vue';
import petDeleteWarning from '@/assets/images/pet-delete-warning.png';
import petSuccess from '@/assets/images/pet-success.png';

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

// 해제 요청이 진행 중일 때는 바텀시트를 닫지 못하게 막아요.
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
    unlinkError.value = '연동 해제에 실패했어요. 다시 시도해주세요';
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
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-5 pt-8 pb-10">
    <!-- 완료 화면: 목록 위에 전체 화면으로 덮음 -->
    <div
      v-if="showUnlinkSuccess"
      class="fixed inset-0 z-40 bg-(--color-white) flex flex-col items-center justify-center px-6"
    >
      <img :src="petSuccess" alt="" class="w-40 h-auto mb-6" />
      <h2 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-2">계좌 연동이 해제됐어요</h2>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-10">
        {{ unlinkedAccountName }} 계좌가 목록에서 제거됐어요
      </p>
      <button
        class="w-full max-w-[340px] py-4 rounded-xl bg-(--color-gold) text-(color:--color-navy) font-bold"
        @click="closeUnlinkSuccess"
      >
        확인
      </button>
    </div>

    <template v-else>
      <header class="mb-7">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">계좌 관리</h1>
        <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-1">CODEF로 연동된 계좌를 확인해요</p>
      </header>

      <section class="mb-6">
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">연동된 계좌</h2>

        <p v-if="store.isLoading" class="text-(length:--font-sm) text-(color:--color-gray-500)">불러오는 중이에요…</p>

        <div v-else-if="loadError" class="p-4 rounded-2xl bg-(--color-surface) mb-3 text-center">
          <p class="text-(length:--font-sm) text-(color:--color-danger) mb-3">{{ loadError }}</p>
          <button
            class="px-5 py-2 rounded-xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold"
            @click="loadAccounts"
          >
            다시 시도
          </button>
        </div>

        <p v-else-if="store.accounts.length === 0" class="text-(length:--font-sm) text-(color:--color-gray-500)">
          아직 연동된 계좌가 없어요
        </p>

        <ul v-if="!store.isLoading && !loadError" class="flex flex-col gap-3">
          <li
            v-for="account in store.accounts"
            :key="account.accountId"
            class="flex items-start gap-3 p-4 rounded-2xl bg-(--color-surface) border border-(--color-border)"
          >
            <BankBadge :bank-code="account.bankCode" :size="40" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-baseline gap-1.5">
                  <span class="font-bold text-(color:--color-navy) text-(length:--font-base)">
                    {{ getBankMeta(account.bankCode).name }}
                  </span>
                  <span class="text-(length:--font-sm) text-(color:--color-gray-500)">{{ account.accountNumberMasked }}</span>
                </div>
                <button
                  class="text-(length:--font-sm) text-(color:--color-gray-500) underline underline-offset-2"
                  @click="openUnlink(account)"
                >
                  해제
                </button>
              </div>
              <p class="text-(length:--font-sm) text-(color:--color-gray-600) mt-1">
                {{ formatWon(account.balance) }}<span v-if="account.isPrimary"> · 주계좌</span>
              </p>
            </div>
          </li>
        </ul>
      </section>

      <button
        class="w-full py-4 rounded-xl bg-(--color-navy) text-(color:--color-white) font-bold mb-6"
        @click="goToLink"
      >
        + 계좌 연동하기
      </button>

      <div class="p-4 rounded-2xl bg-(--color-surface)">
        <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-1">
          계좌 데이터는 CODEF API를 통해 조회 전용으로 연동돼요
        </p>
        <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">
          실제 자금은 이동하지 않으며, 잔액 확인 및 버킷 관리 목적에만 사용됩니다
        </p>
      </div>
    </template>

    <!-- 해제 확인 바텀시트 -->
    <BottomSheet :model-value="showUnlinkSheet" size="tall" @update:model-value="closeUnlinkSheet">
      <div v-if="pendingAccount" class="flex flex-col items-center text-center">
        <img :src="petDeleteWarning" alt="" class="w-24 h-auto mb-3" />
        <h3 class="text-(length:--font-lg) font-bold text-(color:--color-navy) mb-1">계좌 연동을 해제할까요?</h3>
        <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-5">해제 후에도 언제든 다시 연동할 수 있어요</p>

        <div class="w-full flex items-center gap-3 p-4 rounded-2xl bg-(--color-surface) mb-4 text-left">
          <BankBadge :bank-code="pendingAccount.bankCode" :size="40" />
          <div>
            <p class="font-bold text-(color:--color-navy) text-(length:--font-base)">
              {{ getBankMeta(pendingAccount.bankCode).name }}
            </p>
            <p class="text-(length:--font-sm) text-(color:--color-gray-600)">
              {{ formatWon(pendingAccount.balance) }}<span v-if="pendingAccount.isPrimary"> · 주계좌</span>
            </p>
          </div>
        </div>

        <ul class="w-full flex flex-col gap-2 mb-6 text-left">
          <li class="flex items-start gap-2 text-(length:--font-sm) text-(color:--color-gray-600)">
            <span class="w-1 h-1 rounded-full bg-(--color-gray-500) mt-2 shrink-0" />
            이 계좌가 포함된 버킷·SOS포켓 잔액 표시가 중단돼요
          </li>
          <li class="flex items-start gap-2 text-(length:--font-sm) text-(color:--color-gray-600)">
            <span class="w-1 h-1 rounded-full bg-(--color-gray-500) mt-2 shrink-0" />
            결제 내역·자동 태깅 기록은 그대로 보관돼요
          </li>
          <li class="flex items-start gap-2 text-(length:--font-sm) text-(color:--color-gray-600)">
            <IconLock :size="12" color="var(--color-gray-500)" class="mt-1 shrink-0" />
            다시 연동하면 잔액이 새로 조회돼요
          </li>
        </ul>

        <p v-if="unlinkError" class="text-(length:--font-sm) text-(color:--color-danger) mb-3">{{ unlinkError }}</p>

        <div class="w-full flex gap-3">
          <button
            class="flex-1 py-3.5 rounded-xl border border-(--color-border) text-(color:--color-navy) font-semibold disabled:opacity-60"
            :disabled="isUnlinking"
            @click="closeUnlinkSheet"
          >
            취소
          </button>
          <button
            class="flex-1 py-3.5 rounded-xl bg-(--color-danger) text-(color:--color-white) font-semibold disabled:opacity-60"
            :disabled="isUnlinking"
            @click="confirmUnlink"
          >
            {{ isUnlinking ? '해제하는 중…' : '해제하기' }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>