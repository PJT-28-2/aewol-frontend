<script setup>
import { useRouter } from 'vue-router';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';
import AppButton from '@/components/common/AppButton.vue';

const router = useRouter();

function goToSettings() {
  router.replace({ name: 'Settings' });
}
</script>

<template>
  <CompletionPageLayout
    title="비밀번호 재설정 완료"
    description="새 간편 비밀번호로 결제할 수 있어요"
  >
    <AppButton
      variant="primary"
      size="lg"
      block
      class="mt-(--space-8) rounded-(--radius-2xl)"
      @click="goToSettings"
    >
      마이페이지로 이동
    </AppButton>
  </CompletionPageLayout>
</template>
