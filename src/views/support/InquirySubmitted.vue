<script setup>
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import AppButton from '@/components/common/AppButton.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';

const router = useRouter();
const store = useSupportStore();

function goToMyInquiries() {
  router.replace({ name: 'MyInquiries' });
}
</script>

<template>
  <CompletionPageLayout
    title="문의 접수 완료"
    description="평균 5분 이내에 답변드릴게요"
  >
    <div
      v-if="store.lastSubmittedInquiry"
      class="mt-(--space-6) flex w-full items-center justify-center rounded-(--radius-xl) bg-(--color-white) p-(--space-4)"
    >
      <span class="text-(length:--font-sm) text-(color:--color-gray-600)">
        문의번호&nbsp;
        <span class="font-semibold text-(color:--color-navy)">
          {{ store.lastSubmittedInquiry.inquiryNumber }}
        </span>
      </span>
    </div>

    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="goToMyInquiries"
      >
        문의 내역 확인하기
      </AppButton>
    </template>
  </CompletionPageLayout>
</template>
