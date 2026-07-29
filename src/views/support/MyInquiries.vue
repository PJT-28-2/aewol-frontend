<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';

const router = useRouter();
const store = useSupportStore();
const loadError = ref('');

async function loadInquiries() {
  loadError.value = '';
  try {
    await store.fetchMyInquiries();
  } catch {
    loadError.value = '문의 내역을 불러오지 못했어요. 다시 시도해주세요';
  }
}

onMounted(() => {
  loadInquiries();
});

// status: 'ANSWERED' | 'PENDING' — 실제 enum 값은 API 확정 시 맞춰주면 됩니다.
function statusLabel(status) {
  return status === 'ANSWERED' ? '답변완료' : '답변대기';
}

function statusClass(status) {
  return status === 'ANSWERED'
    ? 'bg-(--color-gold) text-(color:--color-navy)'
    : 'bg-(--color-gray-200) text-(color:--color-gray-700)';
}

function formatDate(dateString) {
  if (!dateString) return '';
  return dateString.slice(0, 10).replaceAll('-', '.');
}
</script>

<template>
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-5 pt-6 pb-10">
    <button
      class="-ml-2 p-2 flex items-center justify-center mb-5"
      @click="router.back()"
    >
      <IconArrowLeft :size="20" color="var(--color-gray-700)" />
    </button>

    <header class="mb-6">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">내 문의 내역</h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-1">지금까지 문의한 내용을 확인해요</p>
    </header>

    <p v-if="store.isLoading" class="text-(length:--font-sm) text-(color:--color-gray-500) mb-4">불러오는 중이에요…</p>

    <div v-else-if="loadError" class="p-4 rounded-2xl bg-(--color-surface) mb-4 text-center">
      <p class="text-(length:--font-sm) text-(color:--color-danger) mb-3">{{ loadError }}</p>
      <button
        class="px-5 py-2 rounded-xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold"
        @click="loadInquiries"
      >
        다시 시도
      </button>
    </div>

    <p v-else-if="store.myInquiries.length === 0" class="text-(length:--font-sm) text-(color:--color-gray-500) mb-4">
      아직 문의한 내역이 없어요
    </p>

    <ul v-if="!store.isLoading && !loadError" class="flex flex-col gap-3 mb-8">
      <li
        v-for="inquiry in store.myInquiries"
        :key="inquiry.inquiryId"
        class="rounded-2xl bg-(--color-surface) p-4"
      >
        <!-- TODO: 문의 상세 화면(RF-CM 목업 없음) 라우트가 생기면 여기서 이동 처리 -->
        <button class="w-full flex items-center justify-between gap-3">
          <div class="flex-1 text-left">
            <span
              class="inline-block px-2.5 py-1 rounded-full text-(length:--font-xs) font-semibold mb-2"
              :class="statusClass(inquiry.status)"
            >
              {{ statusLabel(inquiry.status) }}
            </span>
            <p class="font-semibold text-(color:--color-navy) text-(length:--font-md)">{{ inquiry.title }}</p>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-1">{{ formatDate(inquiry.createdAt) }}</p>
          </div>
          <IconChevronRight :size="18" color="var(--color-gray-400)" class="shrink-0" />
        </button>
      </li>
    </ul>

    <button
      class="w-full py-4 rounded-xl bg-(--color-navy) text-(color:--color-white) font-bold"
      @click="router.push({ name: 'InquiryForm' })"
    >
      + 새 문의 작성하기
    </button>
  </div>
</template>