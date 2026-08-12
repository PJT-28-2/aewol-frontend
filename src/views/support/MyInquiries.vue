<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconPaw from '@/components/common/icons/IconPaw.vue';

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

async function loadMore() {
  try {
    await store.loadMoreInquiries();
  } catch {
    loadError.value = '문의 내역을 더 불러오지 못했어요. 다시 시도해주세요';
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
    ? 'bg-(--color-leaf-surface) text-(color:--color-leaf-dark)'
    : 'bg-(--color-icon-yellow-soft) text-(color:--color-icon-yellow)';
}

function formatDate(dateString) {
  if (!dateString) return '';
  return dateString.slice(0, 10).replaceAll('-', '.');
}

function goToInquiryDetail(inquiryId) {
  router.push({ name: 'InquiryDetail', params: { inquiryId } });
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-5 pt-(--space-4) pb-10">
    <header class="mb-6">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        내 문의 내역
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-1">
        지금까지 문의한 내용을 확인해요
      </p>
    </header>

    <p
      v-if="store.isLoading"
      class="text-(length:--font-sm) text-(color:--color-gray-500) mb-4"
    >
      불러오는 중이에요…
    </p>

    <div
      v-else-if="loadError"
      class="mb-4 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-3">
        {{ loadError }}
      </p>
      <button
        class="rounded-(--radius-xl) bg-(--color-leaf) px-5 py-2 text-(length:--font-sm) font-semibold text-(color:--color-navy)"
        @click="loadInquiries"
      >
        다시 시도
      </button>
    </div>

    <p
      v-else-if="store.myInquiries.length === 0"
      class="text-(length:--font-sm) text-(color:--color-gray-500) mb-4"
    >
      아직 문의한 내역이 없어요
    </p>

    <ul
      v-if="!store.isLoading && !loadError"
      class="flex flex-col gap-3 mb-8"
    >
      <li
        v-for="inquiry in store.myInquiries"
        :key="inquiry.inquiryId"
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 shadow-(--shadow-card)"
      >
        <button
          class="w-full flex items-start justify-between gap-3"
          @click="goToInquiryDetail(inquiry.inquiryId)"
        >
          <div class="flex flex-1 min-w-0 items-start gap-3 text-left">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-leaf-surface)">
              <IconPaw
                :size="18"
                color="var(--color-leaf-dark)"
              />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-(color:--color-navy) text-(length:--font-md)">
                {{ inquiry.title }}
              </p>
              <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-1">
                {{ formatDate(inquiry.createdAt) }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <span
              class="inline-block px-2.5 py-1 rounded-full text-(length:--font-xs) font-semibold"
              :class="statusClass(inquiry.status)"
            >
              {{ statusLabel(inquiry.status) }}
            </span>
            <IconChevronRight
              :size="16"
              color="var(--color-gray-400)"
            />
          </div>
        </button>
      </li>
    </ul>

    <button
      v-if="!store.isLoading && !loadError && store.inquiriesHasNext"
      class="w-full mb-4 rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) py-3 text-(length:--font-sm) font-semibold text-(color:--color-gray-700) disabled:opacity-50"
      :disabled="store.isLoadingMoreInquiries"
      @click="loadMore"
    >
      {{ store.isLoadingMoreInquiries ? '불러오는 중…' : '더보기' }}
    </button>

    <button
      class="w-full rounded-(--radius-xl) bg-(--color-leaf) py-4 font-bold text-(color:--color-navy)"
      @click="router.push({ name: 'InquiryForm' })"
    >
      + 새 문의 작성하기
    </button>
  </div>
</template>
