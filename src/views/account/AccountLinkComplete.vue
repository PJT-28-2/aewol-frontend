<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import AccountSummaryCard from '@/components/common/AccountSummaryCard.vue';
import AppButton from '@/components/common/AppButton.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';

const router = useRouter();
const store = useAccountStore();

// "배열의 마지막 항목" 같은 불안정한 추측 대신, 방금 연동 완료 시 store에 저장해둔
// 정확한 accountId로 찾아요. 이 값이 없거나 계좌를 못 찾으면 잘못된 진입(직접 URL 접근 등)
// 이므로 성공 화면을 보여주지 않고 안내 후 안전하게 돌려보내요.
// computed라서 store가 나중에(마운트 이후) 리셋되는 경우까지 반응형으로 계속 감지해요 —
// onMounted에서 한 번만 검사하면 그 이후 store가 비는 상황을 못 잡아서 렌더링이 깨져요.
const linkedAccount = computed(
  () => store.accounts.find((a) => a.accountId === store.lastLinkedAccountId) ?? null,
);

function goToAccountManagement() {
  store.resetLinkingState();
  router.replace({ name: 'AccountManagement' });
}
</script>

<template>
  <CompletionPageLayout
    v-if="!linkedAccount"
    title="연동 정보를 찾을 수 없어요"
    description="계좌 관리 화면에서 연동 상태를 다시 확인해주세요"
    variant="danger"
  >
    <AppButton
      variant="primary"
      size="lg"
      block
      class="mt-(--space-4) !rounded-(--radius-2xl)"
      @click="goToAccountManagement"
    >
      계좌 관리로 이동
    </AppButton>
  </CompletionPageLayout>

  <CompletionPageLayout
    v-else
    title="계좌 연동 완료"
    description="연결된 계좌를 애월 지갑에서 사용할 수 있어요"
  >
    <AccountSummaryCard
      :bank-code="linkedAccount.bankCode"
      :badge-size="36"
      class="mt-(--space-6) w-full border border-(--color-leaf)"
    />

    <AppButton
      variant="primary"
      size="lg"
      block
      class="mt-(--space-4) !rounded-(--radius-2xl)"
      @click="goToAccountManagement"
    >
      계좌 관리로
    </AppButton>
  </CompletionPageLayout>
</template>
