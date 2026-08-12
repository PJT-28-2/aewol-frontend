<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import { SUPPORT_CATEGORIES } from '@/mocks/support';
import IconSearch from '@/components/common/icons/IconSearch.vue';
import IconChatBubble from '@/components/common/icons/IconChatBubble.vue';
import IconDocument from '@/components/common/icons/IconDocument.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconClose from '@/components/common/icons/IconClose.vue';

const router = useRouter();
const store = useSupportStore();

const keyword = ref('');
const selectedCategory = ref('전체');
const expandedFaqId = ref(null);
const isLoadingAnswer = ref(false);
const answerError = ref('');
const loadError = ref('');

const CATEGORY_FILTERS = ['전체', ...SUPPORT_CATEGORIES];

async function loadFaqs() {
  loadError.value = '';
  try {
    await store.fetchFaqs();
  } catch {
    loadError.value = 'FAQ 목록을 불러오지 못했어요. 다시 시도해주세요';
  }
}

onMounted(() => {
  loadFaqs();
});

// 검색어를 입력했거나 카테고리를 '전체' 외로 선택하면 검색 결과 화면으로 전환돼요.
const isSearchMode = computed(() => keyword.value.trim().length > 0 || selectedCategory.value !== '전체');

// GET /api/support/faqs 에는 검색 엔드포인트가 없어서, 이미 받아온 질문 목록을 클라이언트에서 필터링해요.
const filteredFaqs = computed(() => {
  const kw = keyword.value.trim();
  return store.faqs.filter((faq) => {
    const matchesKeyword = !kw || faq.question.includes(kw);
    const matchesCategory = selectedCategory.value === '전체' || faq.category === selectedCategory.value;
    return matchesKeyword && matchesCategory;
  });
});

function clearKeyword() {
  keyword.value = '';
}

async function toggleFaq(faqId) {
  if (expandedFaqId.value === faqId) {
    expandedFaqId.value = null;
    return;
  }
  expandedFaqId.value = faqId;
  isLoadingAnswer.value = true;
  answerError.value = '';
  try {
    await store.ensureFaqAnswer(faqId);
  } catch {
    answerError.value = '답변을 불러오지 못했어요. 다시 시도해주세요';
  } finally {
    isLoadingAnswer.value = false;
  }
}

function goToFaqDetail(faqId) {
  router.push({ name: 'FaqDetail', params: { faqId } });
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-5 pt-(--space-4) pb-10">
    <header class="mb-5">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        고객센터
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-1">
        무엇을 도와드릴까요?
      </p>
    </header>

    <div class="relative mb-4">
      <IconSearch
        :size="18"
        color="var(--color-gray-500)"
        class="absolute left-4 top-1/2 -translate-y-1/2"
      />
      <input
        v-model="keyword"
        type="text"
        placeholder="궁금한 내용을 검색해보세요"
        class="w-full h-(--control-height-md) pl-11 pr-11 rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-leaf)"
      >
      <button
        v-if="keyword"
        class="absolute right-4 top-1/2 -translate-y-1/2"
        @click="clearKeyword"
      >
        <IconClose
          :size="16"
          color="var(--color-gray-400)"
        />
      </button>
    </div>

    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="cat in CATEGORY_FILTERS"
        :key="cat"
        class="px-4 py-2 rounded-full text-(length:--font-sm) font-medium"
        :class="
          selectedCategory === cat
            ? 'border border-(--color-leaf) bg-(--color-leaf-soft) text-(color:--color-navy)'
            : 'border border-(--color-card-border) bg-(--color-white) text-(color:--color-gray-600)'
        "
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div
      v-if="!isSearchMode"
      class="grid grid-cols-2 gap-3 mb-7"
    >
      <button
        class="flex items-center gap-3 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-left shadow-(--shadow-card)"
        @click="router.push({ name: 'InquiryForm' })"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-leaf-surface)">
          <IconChatBubble
            :size="20"
            color="var(--color-leaf-dark)"
          />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="font-semibold text-(color:--color-navy) text-(length:--font-md)">1:1 문의하기</span>
          <span class="text-(length:--font-xs) text-(color:--color-gray-500)">문의를 남겨주세요</span>
        </span>
      </button>
      <button
        class="flex items-center gap-3 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-left shadow-(--shadow-card)"
        @click="router.push({ name: 'MyInquiries' })"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-leaf-surface)">
          <IconDocument
            :size="20"
            color="var(--color-leaf-dark)"
          />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="font-semibold text-(color:--color-navy) text-(length:--font-md)">내 문의 내역</span>
          <span class="text-(length:--font-xs) text-(color:--color-gray-500)">답변 상태 확인</span>
        </span>
      </button>
    </div>

    <!-- 검색 결과 모드: 키워드 검색 or 카테고리 필터 시 -->
    <template v-if="isSearchMode">
      <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">
        <template v-if="keyword.trim()">
          '{{ keyword.trim() }}' 검색 결과 {{ filteredFaqs.length }}건
        </template>
        <template v-else>
          {{ selectedCategory }} 질문 {{ filteredFaqs.length }}건
        </template>
      </h2>

      <ul class="flex flex-col gap-2 mb-6">
        <li
          v-for="faq in filteredFaqs"
          :key="faq.faqId"
        >
          <button
            class="flex w-full items-center justify-between gap-3 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-left shadow-(--shadow-card)"
            @click="goToFaqDetail(faq.faqId)"
          >
            <div>
              <p
                v-if="selectedCategory === '전체'"
                class="text-(length:--font-xs) font-semibold text-(color:--color-gray-500) mb-(--space-1)"
              >
                {{ faq.category }}
              </p>
              <p class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
                {{ faq.question }}
              </p>
            </div>
            <IconChevronRight
              :size="18"
              color="var(--color-gray-400)"
              class="shrink-0"
            />
          </button>
        </li>
      </ul>

      <div class="sticky bottom-(--bottom-nav-height) bg-(--color-app-bg) pt-(--space-3) pb-(--space-3)">
        <div class="flex items-center gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
          <div class="flex-1 min-w-0">
            <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-(--space-1)">
              원하는 답변을 못 찾으셨나요?
            </p>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500)">
              1:1 문의로 직접 물어보세요
            </p>
          </div>

          <button
            class="shrink-0 rounded-(--radius-full) bg-(--color-leaf) px-(--space-4) py-(--space-2) text-(length:--font-sm) font-bold text-(color:--color-navy)"
            @click="router.push({ name: 'InquiryForm' })"
          >
            1:1 문의하기
          </button>
        </div>
      </div>
    </template>

    <!-- 기본 모드: 자주 묻는 질문 아코디언 -->
    <section v-else>
      <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">
        자주 묻는 질문
      </h2>

      <p
        v-if="store.isLoading"
        class="text-(length:--font-sm) text-(color:--color-gray-500)"
      >
        불러오는 중이에요…
      </p>

      <div
        v-else-if="loadError"
        class="mb-3 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-center"
      >
        <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-3">
          {{ loadError }}
        </p>
        <button
          class="rounded-(--radius-xl) bg-(--color-leaf) px-5 py-2 text-(length:--font-sm) font-semibold text-(color:--color-navy)"
          @click="loadFaqs"
        >
          다시 시도
        </button>
      </div>

      <ul
        v-else
        class="flex flex-col gap-3"
      >
        <li
          v-for="faq in filteredFaqs"
          :key="faq.faqId"
          class="overflow-hidden rounded-(--radius-2xl) border shadow-(--shadow-card)"
          :class="
            expandedFaqId === faq.faqId
              ? 'border-(--color-leaf) bg-(--color-leaf-surface)'
              : 'border-(--color-card-border) bg-(--color-white)'
          "
        >
          <button
            class="w-full flex items-center justify-between gap-3 p-4 text-left"
            @click="toggleFaq(faq.faqId)"
          >
            <span class="font-semibold text-(color:--color-navy) text-(length:--font-md)">{{ faq.question }}</span>
            <IconChevronDown
              :size="18"
              color="var(--color-gray-500)"
              class="shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': expandedFaqId === faq.faqId }"
            />
          </button>
          <div
            v-if="expandedFaqId === faq.faqId"
            class="px-4 pb-4"
          >
            <div class="h-px bg-(--color-leaf) opacity-30 mb-3" />
            <p
              v-if="isLoadingAnswer && !faq.answer"
              class="text-(length:--font-sm) text-(color:--color-gray-500)"
            >
              불러오는 중이에요…
            </p>
            <p
              v-else-if="answerError && !faq.answer"
              class="text-(length:--font-sm) text-(color:--color-danger-strong)"
            >
              {{ answerError }}
            </p>
            <p
              v-else
              class="text-(length:--font-sm) text-(color:--color-gray-600) leading-relaxed"
            >
              {{ faq.answer }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <p
      v-if="!isSearchMode"
      class="text-(length:--font-xs) text-(color:--color-gray-500) text-center mt-9"
    >
      운영시간 평일 09:00 - 18:00 (주말 · 공휴일 휴무)
    </p>
  </div>
</template>
