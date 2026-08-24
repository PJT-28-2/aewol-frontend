<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconThumbsUp from '@/components/common/icons/IconThumbsUp.vue';
import IconThumbsDown from '@/components/common/icons/IconThumbsDown.vue';

const route = useRoute();
const router = useRouter();
const store = useSupportStore();

const faq = ref(null);
const relatedFaqs = ref([]);
const isLoading = ref(true);
const loadError = ref('');

// 도움됨/아쉬워요 피드백 — 백엔드 API 명세에 없어서 지금은 로컬(localStorage)에만 저장돼요.
// TODO: 서버 집계가 필요하면 백엔드에 엔드포인트 추가 요청 필요
// FAQ별로 한 번 남긴 의견은 화면을 나갔다 들어와도(재마운트) 유지되어야 해서, faqId별로
// localStorage에 저장해두고 로드 시 복원해요. 복원된 경우 이미 의견을 남긴 것으로 보고
// 버튼을 다시 누를 수 없게 막아요(2026-08-24) — 그렇지 않으면 재방문할 때마다 입력이
// 초기화된 것처럼 보여서 매번 다시 누를 수 있었어요.
const FAQ_FEEDBACK_STORAGE_PREFIX = 'faqFeedback:';
const feedback = ref(null); // 'HELPFUL' | 'NOT_HELPFUL' | null
const feedbackToastVisible = ref(false);
let feedbackToastTimer = null;

function readStoredFeedback(faqId) {
  try {
    return window.localStorage.getItem(`${FAQ_FEEDBACK_STORAGE_PREFIX}${faqId}`);
  } catch {
    return null; // 프라이빗 브라우징 등으로 localStorage를 못 쓰면 매번 새로 입력하게 둬요.
  }
}

function submitFeedback(value) {
  if (feedback.value) return; // 이미 의견을 남겼으면 다시 누를 수 없어요.
  feedback.value = value;
  try {
    window.localStorage.setItem(`${FAQ_FEEDBACK_STORAGE_PREFIX}${route.params.faqId}`, value);
  } catch {
    // 저장 실패해도 이번 세션 화면 표시에는 지장 없으니 조용히 무시해요.
  }
  feedbackToastVisible.value = true;
  window.clearTimeout(feedbackToastTimer);
  feedbackToastTimer = window.setTimeout(() => {
    feedbackToastVisible.value = false;
  }, 2000);
}

onBeforeUnmount(() => window.clearTimeout(feedbackToastTimer));

// 관련 질문을 빠르게 연달아 이동하면 이전 요청과 새 요청이 동시에 떠 있을 수 있어요.
// 매 호출마다 토큰을 증가시키고, 응답이 왔을 때 그게 "가장 최신 호출"일 때만
// faq/relatedFaqs/loadError/isLoading에 반영해서 느린 응답이 최신 화면을 덮어쓰지 못하게 해요.
let latestRequestToken = 0;

async function loadFaq(faqId) {
  const requestToken = ++latestRequestToken;

  isLoading.value = true;
  loadError.value = '';
  feedback.value = readStoredFeedback(faqId);
  window.clearTimeout(feedbackToastTimer);
  feedbackToastVisible.value = false;
  faq.value = null;
  relatedFaqs.value = [];

  try {
    const result = await store.fetchFaqDetail(faqId);
    if (requestToken !== latestRequestToken) return; // 그 사이 더 최신 요청이 시작됐으면 결과 버림
    faq.value = result.faq ?? null;
    relatedFaqs.value = result.relatedFaqs ?? [];
  } catch {
    if (requestToken !== latestRequestToken) return;
    loadError.value = '질문을 불러오지 못했어요. 다시 시도해주세요';
  } finally {
    if (requestToken === latestRequestToken) {
      isLoading.value = false;
    }
  }
}

onMounted(() => loadFaq(route.params.faqId));
watch(
  () => route.params.faqId,
  (newId) => loadFaq(newId),
);

const answerParagraphs = computed(() => (faq.value?.answer ?? '').split('\n\n').filter(Boolean));

function goToRelated(relatedFaqId) {
  router.push({ name: 'FaqDetail', params: { faqId: relatedFaqId } });
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-(--content-max-width) bg-(--color-app-bg) px-5 pt-(--space-4) pb-10">
    <p
      v-if="isLoading"
      class="text-(length:--font-sm) text-(color:--color-gray-500)"
    >
      불러오는 중이에요…
    </p>

    <div
      v-else-if="loadError"
      class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-3">
        {{ loadError }}
      </p>
      <button
        class="rounded-(--radius-xl) bg-(--color-leaf) px-5 py-2 text-(length:--font-sm) font-semibold text-(color:--color-navy)"
        @click="loadFaq(route.params.faqId)"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else-if="!faq"
      class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-3">
        질문을 찾을 수 없어요
      </p>
      <button
        class="rounded-(--radius-xl) bg-(--color-leaf) px-5 py-2 text-(length:--font-sm) font-semibold text-(color:--color-navy)"
        @click="router.push({ name: 'CustomerCenter' })"
      >
        고객센터로 이동
      </button>
    </div>

    <template v-else>
      <p class="text-(length:--font-xs) font-semibold text-(color:--color-gray-500) mb-2">
        {{ faq.category }}
      </p>
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-6 leading-snug">
        {{ faq.question }}
      </h1>

      <div class="h-px bg-(--color-border) mb-6" />

      <div class="mb-8">
        <p
          v-for="(paragraph, i) in answerParagraphs"
          :key="i"
          class="text-(length:--font-md) text-(color:--color-gray-700) leading-relaxed mb-4 last:mb-0"
        >
          {{ paragraph }}
        </p>
      </div>

      <div class="mb-8 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 shadow-(--shadow-card)">
        <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy) text-center mb-3">
          이 답변이 도움이 되었나요?
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-(--radius-xl) text-(length:--font-sm) font-medium disabled:cursor-not-allowed"
            :class="[
              feedback === 'HELPFUL'
                ? 'bg-(--color-leaf-soft) text-(color:--color-navy)'
                : 'bg-(--color-app-bg) text-(color:--color-gray-600)',
              feedback && feedback !== 'HELPFUL' ? 'opacity-50' : '',
            ]"
            :disabled="!!feedback"
            :aria-pressed="feedback === 'HELPFUL'"
            @click="submitFeedback('HELPFUL')"
          >
            <IconThumbsUp
              :size="16"
              :color="feedback === 'HELPFUL' ? 'var(--color-contrast)' : 'var(--color-gray-600)'"
            />
            도움됨
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-(--radius-xl) text-(length:--font-sm) font-medium disabled:cursor-not-allowed"
            :class="[
              feedback === 'NOT_HELPFUL'
                ? 'bg-(--color-leaf-soft) text-(color:--color-navy)'
                : 'bg-(--color-app-bg) text-(color:--color-gray-600)',
              feedback && feedback !== 'NOT_HELPFUL' ? 'opacity-50' : '',
            ]"
            :disabled="!!feedback"
            :aria-pressed="feedback === 'NOT_HELPFUL'"
            @click="submitFeedback('NOT_HELPFUL')"
          >
            <IconThumbsDown
              :size="16"
              :color="feedback === 'NOT_HELPFUL' ? 'var(--color-contrast)' : 'var(--color-gray-600)'"
            />
            아쉬워요
          </button>
        </div>
      </div>

      <section
        v-if="relatedFaqs.length"
        class="mb-8"
      >
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-3">
          관련 질문
        </h2>
        <ul class="flex flex-col gap-2">
          <li
            v-for="related in relatedFaqs"
            :key="related.faqId"
          >
            <button
              class="flex w-full items-center justify-between gap-3 rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-4 text-left shadow-(--shadow-card)"
              @click="goToRelated(related.faqId)"
            >
              <span class="text-(length:--font-md) text-(color:--color-navy)">{{ related.question }}</span>
              <IconChevronRight
                :size="18"
                color="var(--color-gray-400)"
                class="shrink-0"
              />
            </button>
          </li>
        </ul>
      </section>

      <button
        class="w-full py-4 rounded-(--radius-xl) bg-(--color-gold) text-(color:--color-navy) font-bold"
        @click="router.push({ name: 'InquiryForm' })"
      >
        1:1 문의하기
      </button>
    </template>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="feedbackToastVisible"
          role="status"
          aria-live="polite"
          class="fixed top-7 left-1/2 z-[1100] -translate-x-1/2 rounded-(--radius-icon) border border-(--color-border) bg-(--color-white) px-4 py-3 text-[12.5px] font-(--font-bold) text-(color:--color-navy) shadow-(--shadow-lg)"
        >
          소중한 의견 감사합니다
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
