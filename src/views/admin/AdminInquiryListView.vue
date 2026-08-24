<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminInquiryStore } from '@/stores/adminInquiry'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconChatBubble from '@/components/common/icons/IconChatBubble.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'

const router = useRouter()
const store = useAdminInquiryStore()
const loadError = ref('')
const loadMoreError = ref('')

const filters = [
  { label: '전체', value: '' },
  { label: '답변대기', value: 'WAITING' },
  { label: '답변완료', value: 'ANSWERED' },
]

function statusLabel(status) {
  return status === 'ANSWERED' ? '답변완료' : '답변대기'
}

function statusClass(status) {
  return status === 'ANSWERED'
    ? 'bg-(--color-leaf-surface) text-(color:--color-leaf-dark)'
    : 'bg-(--color-warning-soft) text-(color:--color-warning-strong)'
}

function formatDate(dateString) {
  if (!dateString) return ''
  return dateString.slice(0, 10).replaceAll('-', '.')
}

async function loadInquiries(status = store.statusFilter) {
  loadError.value = ''
  try {
    await store.fetchInquiries(status)
  } catch {
    loadError.value = '문의 목록을 불러오지 못했어요. 다시 시도해주세요.'
  }
}

async function loadMore() {
  loadMoreError.value = ''
  try {
    await store.loadMore()
  } catch {
    loadMoreError.value = '문의 목록을 더 불러오지 못했어요.'
  }
}

onMounted(() => loadInquiries())
</script>

<template>
  <section class="mx-auto min-h-screen max-w-(--content-max-width) px-(--space-5) pt-(--space-4) pb-(--space-8)">
    <header class="mb-(--space-5)">
      <p class="mb-(--space-1) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">
        ADMIN
      </p>
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        고객문의 관리
      </h1>
    </header>

    <div
      class="mb-(--space-5) grid grid-cols-3 rounded-(--radius-xl) bg-(--color-info-surface) p-(--space-1)"
      role="tablist"
      aria-label="문의 상태"
    >
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="min-h-10 rounded-(--radius-lg) text-(length:--font-sm) font-semibold transition-colors"
        :class="store.statusFilter === filter.value ? 'bg-(--color-white) text-(color:--color-navy) shadow-(--shadow-sm)' : 'text-(color:--color-slate-dark)'"
        role="tab"
        :aria-selected="store.statusFilter === filter.value"
        @click="loadInquiries(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

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
        @click="loadInquiries()"
      >
        다시 시도
      </AppButton>
    </div>

    <EmptyState
      v-else-if="store.inquiries.length === 0"
      :icon="IconChatBubble"
      :message="store.statusFilter === 'WAITING' ? '답변을 기다리는 문의가 없어요.' : '접수된 문의가 없어요.'"
    />

    <ul
      v-else
      class="flex flex-col gap-(--space-3)"
    >
      <li
        v-for="inquiry in store.inquiries"
        :key="inquiry.inquiryId"
      >
        <button
          type="button"
          class="flex w-full items-center gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-left shadow-(--shadow-card) transition-transform active:scale-[0.99]"
          @click="router.push({ name: 'AdminInquiryDetail', params: { inquiryId: inquiry.inquiryId } })"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--color-icon-gray-soft) text-(color:--color-icon-gray)">
            <IconChatBubble :size="21" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-(--space-2)">
              <span
                v-if="inquiry.category"
                class="text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)"
              >{{ inquiry.category }}</span>
              <span class="text-(length:--font-xs) text-(color:--color-slate-muted)">{{ formatDate(inquiry.createdAt) }}</span>
            </span>
            <strong class="mt-(--space-1) block truncate text-(length:--font-md) text-(color:--color-navy)">{{ inquiry.title }}</strong>
            <span
              v-if="inquiry.inquiryNumber"
              class="mt-(--space-1) block text-(length:--font-xs) text-(color:--color-slate-muted)"
            >{{ inquiry.inquiryNumber }}</span>
          </span>
          <span class="flex shrink-0 flex-col items-end gap-(--space-2)">
            <span
              class="rounded-full px-(--space-2) py-(--space-1) text-(length:--font-xs) font-bold"
              :class="statusClass(inquiry.status)"
            >{{ statusLabel(inquiry.status) }}</span>
            <IconChevronRight
              :size="16"
              class="text-(color:--color-slate)"
            />
          </span>
        </button>
      </li>
    </ul>

    <AppButton
      v-if="!store.isLoading && !loadError && store.hasNext"
      class="mt-(--space-4)"
      variant="secondary"
      block
      :loading="store.isLoadingMore"
      @click="loadMore"
    >
      더보기
    </AppButton>
    <p
      v-if="loadMoreError"
      class="mt-(--space-3) text-center text-(length:--font-xs) text-(color:--color-danger-strong)"
      role="alert"
    >
      {{ loadMoreError }}
    </p>
  </section>
</template>
