<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/account';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';
import AppButton from '@/components/common/AppButton.vue';

const router = useRouter();
const route = useRoute();
const store = useAccountStore();
const returnToCharge = computed(() => route.query.next === '/wallet/charge');

// 이 화면은 최초 계좌 연동 때만 보여요(간편비밀번호를 이번에 처음 설정한 경우).
// 계좌 등록 자체는 PIN 설정 화면 진입 전에 이미 끝나 있어서, 여기서는 바로
// 계좌 관리로 보내면 돼요 — 별도의 "계좌 연동 완료" 화면을 한 번 더 거치지 않아요.
// AccountLinkComplete.vue와 마찬가지로 나가기 전에 linking 상태를 리셋해서,
// 다음 계좌 연동 시도에 이전 verificationId/bankCode가 남아있지 않게 해요.
function goToAccountManagement() {
  store.resetLinkingState();
  router.replace(returnToCharge.value ? '/wallet/charge' : { name: 'AccountManagement' });
}
</script>

<template>
  <CompletionPageLayout title="비밀번호 설정 완료">
    <AppButton
      variant="primary"
      size="lg"
      block
      class="mt-(--space-8) rounded-(--radius-2xl)"
      @click="goToAccountManagement"
    >
      {{ returnToCharge ? '충전 화면으로 돌아가기' : '계좌 관리로 이동' }}
    </AppButton>
  </CompletionPageLayout>
</template>
