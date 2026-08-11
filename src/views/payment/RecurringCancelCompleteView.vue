<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';

const route = useRoute();
const router = useRouter();

const merchantName = computed(
  () => route.query.merchantName || '정기결제',
);

function confirmComplete() {
  router.replace('/payment/recurring');
}
</script>

<template>
  <CompletionPageLayout
    title="정기결제 해지 완료"
    :description="`${merchantName} 결제가 더 이상 진행되지 않아요`"
    variant="cancel"
  >
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="confirmComplete"
      >
        목록으로
      </AppButton>
    </template>
  </CompletionPageLayout>
</template>
