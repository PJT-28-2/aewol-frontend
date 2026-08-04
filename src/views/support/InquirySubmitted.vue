<script setup>
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import petSuccess from '@/assets/images/pet-success.png';

const router = useRouter();
const store = useSupportStore();

function goToMyInquiries() {
  router.replace({ name: 'MyInquiries' });
}
</script>

<template>
  <div class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-6 pt-[calc(var(--header-height)+var(--space-4))] flex flex-col items-center text-center">
    <img :src="petSuccess" alt="" class="w-40 h-auto mb-6" />
    <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-2">문의가 접수됐어요</h1>
    <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-10">평균 5분 이내에 답변드릴게요</p>

    <div
      v-if="store.lastSubmittedInquiry"
      class="w-full flex items-center justify-center p-4 rounded-(--radius-xl) bg-(--color-surface) mb-10"
    >
      <span class="text-(length:--font-sm) text-(color:--color-gray-600)">
        문의번호&nbsp;
        <span class="font-semibold text-(color:--color-navy)">
          {{ store.lastSubmittedInquiry.inquiryNumber }}
        </span>
      </span>
    </div>

    <button
      class="w-full py-4 rounded-(--radius-xl) bg-(--color-gold) text-(color:--color-navy) font-bold"
      @click="goToMyInquiries"
    >
      문의 내역 확인하기
    </button>
  </div>
</template>