<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconDocument from '@/components/common/icons/IconDocument.vue';

const route = useRoute();
const router = useRouter();
const store = useSupportStore();

const inquiry = ref(null);
const isLoading = ref(true);
const loadError = ref('');

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

// 첨부파일은 서버가 URL 문자열로만 내려줘서(File 객체가 아님), 확장자로 이미지/PDF를 구분해요.
function isImageAttachment(url) {
  return /\.(jpe?g|png)(\?.*)?$/i.test(url);
}

function attachmentFileName(url) {
  try {
    return decodeURIComponent(url.split('/').pop().split('?')[0]);
  } catch {
    return url;
  }
}

async function loadInquiry() {
  isLoading.value = true;
  loadError.value = '';
  try {
    inquiry.value = await store.fetchInquiryDetail(route.params.inquiryId);
  } catch {
    loadError.value = '문의 내역을 불러오지 못했어요. 다시 시도해주세요';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadInquiry);
</script>

<template>
  <div class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-5 pt-(--space-4) pb-10">

    <p v-if="isLoading" class="text-(length:--font-sm) text-(color:--color-gray-500)">불러오는 중이에요…</p>

    <div v-else-if="loadError" class="p-4 rounded-(--radius-xl) bg-(--color-surface) text-center">
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-3">{{ loadError }}</p>
      <button
        class="px-5 py-2 rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold"
        @click="loadInquiry"
      >
        다시 시도
      </button>
    </div>

    <div v-else-if="!inquiry" class="p-4 rounded-(--radius-xl) bg-(--color-surface) text-center">
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-3">문의 내역을 찾을 수 없어요</p>
      <button
        class="px-5 py-2 rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold"
        @click="router.push({ name: 'MyInquiries' })"
      >
        내 문의 내역으로 이동
      </button>
    </div>

    <template v-else>
      <div class="flex items-center gap-2 mb-2">
        <span
          class="inline-block px-2.5 py-1 rounded-full text-(length:--font-xs) font-semibold"
          :class="statusClass(inquiry.status)"
        >
          {{ statusLabel(inquiry.status) }}
        </span>
        <span v-if="inquiry.category" class="text-(length:--font-xs) font-semibold text-(color:--color-gray-500)">
          {{ inquiry.category }}
        </span>
      </div>

      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-2 leading-snug">
        {{ inquiry.title }}
      </h1>
      <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-1">{{ formatDate(inquiry.createdAt) }} 문의</p>
      <p v-if="inquiry.inquiryNumber || inquiry.replyEmail" class="text-(length:--font-xs) text-(color:--color-gray-500) mb-6">
        <template v-if="inquiry.inquiryNumber">문의번호 {{ inquiry.inquiryNumber }}</template>
        <template v-if="inquiry.inquiryNumber && inquiry.replyEmail"> · </template>
        <template v-if="inquiry.replyEmail">{{ inquiry.replyEmail }}</template>
      </p>

      <div class="h-px bg-(--color-border) mb-6" />

      <section class="mb-8">
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">문의 내용</h2>
        <p class="text-(length:--font-md) text-(color:--color-gray-700) leading-relaxed rounded-(--radius-xl) bg-(--color-surface) p-4">
          {{ inquiry.content }}
        </p>

        <div v-if="inquiry.attachments?.length" class="flex gap-2 mt-3">
          <a
            v-for="url in inquiry.attachments"
            :key="url"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-16 h-16 rounded-(--radius-lg) overflow-hidden bg-(--color-surface) shrink-0"
          >
            <img v-if="isImageAttachment(url)" :src="url" alt="" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
              <IconDocument :size="20" color="var(--color-gray-500)" />
              <span class="text-(length:--font-xs) text-(color:--color-gray-600) truncate w-full text-center">{{ attachmentFileName(url) }}</span>
            </div>
          </a>
        </div>
      </section>

      <section>
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">답변</h2>
        <p
          v-if="inquiry.status === 'ANSWERED'"
          class="text-(length:--font-md) text-(color:--color-gray-700) leading-relaxed rounded-(--radius-xl) bg-(--color-surface) p-4"
        >
          {{ inquiry.answer }}
        </p>
        <p v-if="inquiry.status === 'ANSWERED' && inquiry.answeredAt" class="text-(length:--font-xs) text-(color:--color-gray-500) mt-2">
          {{ formatDate(inquiry.answeredAt) }} 답변
        </p>
        <p v-else class="text-(length:--font-sm) text-(color:--color-gray-500) rounded-(--radius-xl) bg-(--color-surface) p-4 text-center">
          아직 답변이 등록되지 않았어요. 답변이 완료되면 알려드릴게요.
        </p>
      </section>
    </template>
  </div>
</template>
