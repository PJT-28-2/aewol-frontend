<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import { getBankMeta, formatWon } from '@/utils/bankMeta';
import BankBadge from '@/components/common/BankBadge.vue';
import petSuccess from '@/assets/images/pet-success.png';

const router = useRouter();
const store = useAccountStore();

const linkedAccount = computed(
  () => store.accounts[store.accounts.length - 1] ?? null,
);
const bankMeta = computed(() =>
  linkedAccount.value ? getBankMeta(linkedAccount.value.bankCode) : null,
);

function goToAccountManagement() {
  store.resetLinkingState();
  router.replace({ name: 'AccountManagement' });
}
</script>

<template>
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-6 pt-24 flex flex-col items-center text-center">
    <img :src="petSuccess" alt="" class="w-40 h-auto mb-6" />
    <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-2">계좌 연동이 완료됐어요</h1>
    <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-10">실시간 잔액을 지금 바로 확인할 수 있어요</p>

    <div
      v-if="linkedAccount"
      class="w-full flex items-center gap-3 p-4 rounded-2xl bg-(--color-surface) mb-10 text-left"
    >
      <BankBadge :bank-code="linkedAccount.bankCode" :size="36" />
      <div>
        <p class="font-bold text-(color:--color-navy) text-(length:--font-base)">{{ bankMeta.name }}</p>
        <p class="text-(length:--font-sm) text-(color:--color-gray-600)">{{ formatWon(linkedAccount.balance) }}</p>
      </div>
    </div>

    <button
      class="w-full py-4 rounded-xl bg-(--color-gold) text-(color:--color-navy) font-bold"
      @click="goToAccountManagement"
    >
      확인
    </button>
  </div>
</template>