<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import AccountSummaryCard from '@/components/common/AccountSummaryCard.vue';
import petSuccess from '@/assets/images/pet-success.png';

const router = useRouter();
const store = useAccountStore();

// "배열의 마지막 항목" 같은 불안정한 추측 대신, 방금 연동 완료 시 store에 저장해둔
// 정확한 accountId로 찾아요. 이 값이 없거나 계좌를 못 찾으면 잘못된 진입(직접 URL 접근 등)
// 이므로 성공 화면을 보여주지 않고 안내 후 안전하게 돌려보내요.
const linkedAccount = computed(
  () => store.accounts.find((a) => a.accountId === store.lastLinkedAccountId) ?? null,
);

const showInvalidState = ref(false);

onMounted(() => {
  if (!linkedAccount.value) {
    showInvalidState.value = true;
  }
});

function goToAccountManagement() {
  store.resetLinkingState();
  router.replace({ name: 'AccountManagement' });
}
</script>

<template>
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-(--space-6) pt-(--space-4) flex flex-col items-center text-center">
    <template v-if="showInvalidState">
      <h1 class="text-(length:--font-2xl) font-(--font-bold) text-(color:--color-navy) mb-(--space-2)">
        연동 정보를 찾을 수 없어요
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)">
        계좌 관리 화면에서 연동 상태를 다시 확인해주세요
      </p>
      <button
        class="w-full py-(--space-4) rounded-(--radius-lg) bg-(--color-navy) text-(color:--color-white) font-(--font-bold)"
        @click="goToAccountManagement"
      >
        계좌 관리로 이동
      </button>
    </template>

    <template v-else>
      <img :src="petSuccess" alt="" class="w-40 h-auto mb-(--space-6)" />
      <h1 class="text-(length:--font-2xl) font-(--font-bold) text-(color:--color-navy) mb-(--space-2)">
        계좌 연동이 완료됐어요
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)">
        실시간 잔액을 지금 바로 확인할 수 있어요
      </p>

      <AccountSummaryCard
        :bank-code="linkedAccount.bankCode"
        :balance="linkedAccount.balance"
        :badge-size="36"
        class="w-full mb-(--space-8)"
      />

      <button
        class="w-full py-(--space-4) rounded-(--radius-lg) bg-(--color-gold) text-(color:--color-navy) font-(--font-bold)"
        @click="goToAccountManagement"
      >
        확인
      </button>
    </template>
  </div>
</template>