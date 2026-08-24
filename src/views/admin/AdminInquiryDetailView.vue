<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminInquiryStore } from '@/stores/adminInquiry'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'

const route = useRoute()
const store = useAdminInquiryStore()
const answer = ref('')
const loadError = ref('')
const saveError = ref('')
const savedMessage = ref('')

function formatDate(dateString) {
  if (!dateString) return ''
  return dateString.slice(0, 16).replace('T', ' ').replaceAll('-', '.')
}

function isImageAttachment(url) {
  return /\.(jpe?g|png)(\?.*)?$/i.test(url)
}

function attachmentFileName(url) {
  try {
    return decodeURIComponent(url.split('/').pop().split('?')[0])
  } catch {
    return '첨부파일'
  }
}

async function loadInquiry() {
  loadError.value = ''
  try {
    const inquiry = await store.fetchInquiry(route.params.inquiryId)
    answer.value = inquiry?.answer ?? ''
  } catch {
    loadError.value = '문의 내용을 불러오지 못했어요. 다시 시도해주세요.'
  }
}

async function submitAnswer() {
  const normalizedAnswer = answer.value.trim()
  saveError.value = ''
  savedMessage.value = ''
  if (!normalizedAnswer) {
    saveError.value = '답변을 입력해주세요.'
    return
  }
  if (normalizedAnswer.length > 5000) {
    saveError.value = '답변은 5000자 이하로 입력해주세요.'
    return
  }

  try {
    const inquiry = await store.saveAnswer(route.params.inquiryId, normalizedAnswer)
    answer.value = inquiry.answer ?? normalizedAnswer
    savedMessage.value = '답변을 저장했어요.'
  } catch (error) {
    saveError.value = error.response?.data?.message ?? '답변을 저장하지 못했어요. 다시 시도해주세요.'
  }
}

onMounted(loadInquiry)
</script>

<template>
  <section class="mx-auto min-h-screen max-w-(--content-max-width) px-(--space-5) pt-(--space-4) pb-(--space-8)">
    <div
      v-if="store.isLoading"
      class="flex min-h-48 items-center justify-center"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) text-center"
    >
      <p
        class="mb-(--space-4) text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        {{ loadError }}
      </p>
      <AppButton
        size="sm"
        @click="loadInquiry"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else-if="store.selectedInquiry">
      <header class="mb-(--space-5)">
        <div class="mb-(--space-2) flex flex-wrap items-center gap-(--space-2)">
          <span class="rounded-full bg-(--color-leaf-soft) px-(--space-2) py-(--space-1) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">{{ store.selectedInquiry.category }}</span>
          <span
            class="rounded-full px-(--space-2) py-(--space-1) text-(length:--font-xs) font-bold"
            :class="store.selectedInquiry.status === 'ANSWERED' ? 'bg-(--color-leaf-surface) text-(color:--color-leaf-dark)' : 'bg-(--color-warning-soft) text-(color:--color-warning-strong)'"
          >
            {{ store.selectedInquiry.status === 'ANSWERED' ? '답변완료' : '답변대기' }}
          </span>
        </div>
        <h1 class="break-words text-(length:--font-xl) font-bold leading-snug text-(color:--color-navy)">
          {{ store.selectedInquiry.title }}
        </h1>
        <p class="mt-(--space-2) text-(length:--font-xs) leading-relaxed text-(color:--color-slate-muted)">
          {{ store.selectedInquiry.inquiryNumber }} · {{ formatDate(store.selectedInquiry.createdAt) }}<br>
          답변 이메일 {{ store.selectedInquiry.replyEmail }}
        </p>
      </header>

      <section class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)">
        <h2 class="mb-(--space-3) text-(length:--font-base) font-bold text-(color:--color-navy)">
          문의 내용
        </h2>
        <p class="whitespace-pre-wrap break-words text-(length:--font-md) leading-[1.7] text-(color:--color-slate-dark)">
          {{ store.selectedInquiry.content }}
        </p>

        <div
          v-if="store.selectedInquiry.attachments?.length"
          class="mt-(--space-4) flex flex-wrap gap-(--space-2)"
        >
          <a
            v-for="url in store.selectedInquiry.attachments"
            :key="url"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-20 w-20 flex-col items-center justify-center overflow-hidden rounded-(--radius-lg) border border-(--color-card-border) bg-(--color-surface) text-(color:--color-slate-dark)"
            :aria-label="`첨부파일 ${attachmentFileName(url)} 새 창에서 열기`"
          >
            <img
              v-if="isImageAttachment(url)"
              :src="url"
              alt=""
              class="h-full w-full object-cover"
            >
            <template v-else>
              <IconDocument :size="22" />
              <span class="mt-(--space-1) w-full truncate px-(--space-1) text-center text-(length:--font-xs)">{{ attachmentFileName(url) }}</span>
            </template>
          </a>
        </div>
      </section>

      <form
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)"
        @submit.prevent="submitAnswer"
      >
        <div class="mb-(--space-3) flex items-end justify-between gap-(--space-3)">
          <label
            for="inquiry-answer"
            class="text-(length:--font-base) font-bold text-(color:--color-navy)"
          >
            관리자 답변
          </label>
          <span class="text-(length:--font-xs) text-(color:--color-slate-muted)">{{ answer.length.toLocaleString('ko-KR') }} / 5,000</span>
        </div>
        <textarea
          id="inquiry-answer"
          v-model="answer"
          maxlength="5000"
          rows="9"
          class="w-full resize-y rounded-(--radius-xl) border border-(--color-border) bg-(--color-app-bg) p-(--space-4) text-(length:--font-md) leading-[1.7] text-(color:--color-navy) outline-none transition-colors placeholder:text-(--color-slate-muted) focus:border-(--color-leaf-dark) focus:shadow-(--shadow-focus)"
          placeholder="고객에게 전달할 답변을 입력해주세요."
        />
        <p
          v-if="saveError"
          class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ saveError }}
        </p>
        <p
          v-if="savedMessage"
          class="mt-(--space-2) text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)"
          role="status"
        >
          {{ savedMessage }}
        </p>
        <p
          v-if="store.selectedInquiry.answeredAt"
          class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-slate-muted)"
        >
          마지막 답변 {{ formatDate(store.selectedInquiry.answeredAt) }}
        </p>
        <AppButton
          class="mt-(--space-4)"
          type="submit"
          block
          :loading="store.isSaving"
        >
          {{ store.selectedInquiry.status === 'ANSWERED' ? '답변 수정하기' : '답변 등록하기' }}
        </AppButton>
      </form>
    </template>
  </section>
</template>
