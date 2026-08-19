<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';

const route = useRoute();
const router = useRouter();

const dayOfMonth = computed(() => route.query.dayOfMonth || '');
const amount = computed(() => Number(route.query.amount) || 0);

function confirmComplete() {
  router.replace('/payment/recurring');
}
</script>

<template>
  <CompletionPageLayout
    title="정기결제 등록 완료"
    :description="`매월 ${dayOfMonth}일에 ${amount.toLocaleString()}원이 자동으로 결제돼요`"
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
