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
    title="문의 등록 완료"
    description="답변이 등록되면 알림으로 알려드릴게요."
  >
    <div
      v-if="store.lastSubmittedInquiry"
      class="mt-(--space-6) flex w-full items-center justify-center gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)"
    >
      <span class="text-(length:--font-sm) text-(color:--color-gray-600)">
        문의번호
      </span>
      <span class="h-4 w-px bg-(--color-border)" />
      <span class="font-semibold text-(color:--color-navy)">
        {{ store.lastSubmittedInquiry.inquiryNumber }}
      </span>
    </div>

    <AppButton
      variant="primary"
      size="lg"
      block
      radius="2xl"
      class="mt-(--space-4)"
      @click="goToMyInquiries"
    >
      내 문의 보기
    </AppButton>
  </CompletionPageLayout>
</template>
