<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminDiaryReportStore } from '@/stores/adminDiaryReport'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'

const router = useRouter()
const store = useAdminDiaryReportStore()

const filters = [
  { value: 'PENDING', label: '미처리' },
  { value: 'RESOLVED', label: '처리 완료' },
  { value: '', label: '전체' },
]
const reasonLabels = {
  SPAM: '스팸·홍보',
  ABUSE: '욕설·괴롭힘',
  SEXUAL: '음란물',
  PRIVACY: '개인정보 노출',
  ETC: '기타',
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value))
}

function changeStatus(status) {
  if (status === store.status) return
  store.fetchReports({ page: 0, status })
}

onMounted(() => store.fetchReports({ page: 0 }))
</script>

<template>
  <main class="min-h-full bg-(--color-app-bg) px-(--space-4) pb-(--space-8) pt-(--space-4)">
    <header>
      <p class="text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">
        ADMIN
      </p>
      <h1 class="mt-(--space-1) text-(length:--font-2xl) font-extrabold text-(color:--color-navy)">
        멍스타그램 신고 관리
      </h1>
    </header>

    <div
      class="mt-(--space-5) flex gap-(--space-2)"
      role="group"
      aria-label="신고 상태 필터"
    >
      <button
        v-for="filter in filters"
        :key="filter.label"
        type="button"
        class="rounded-full border px-(--space-4) py-(--space-2) text-(length:--font-sm) font-bold"
        :class="store.status === filter.value
          ? 'border-(--color-leaf) bg-(--color-leaf) text-(color:--color-navy)'
          : 'border-(--color-card-border) bg-(--color-white) text-(color:--color-slate-dark)'"
        @click="changeStatus(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div
      v-if="store.isLoading"
      class="py-(--space-10)"
    >
      <LoadingSpinner />
    </div>
    <div
      v-else-if="store.error"
      class="mt-(--space-5) rounded-(--radius-xl) bg-(--color-danger-soft) p-(--space-4)"
      role="alert"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong)">
        {{ store.error }}
      </p>
      <button
        type="button"
        class="mt-(--space-3) font-bold text-(color:--color-navy)"
        @click="store.fetchReports()"
      >
        다시 시도
      </button>
    </div>
    <EmptyState
      v-else-if="!store.reports.length"
      :icon="IconWarning"
      message="해당 상태의 신고가 없습니다."
    />
    <section
      v-else
      class="mt-(--space-4) space-y-(--space-3)"
      aria-label="신고 목록"
    >
      <button
        v-for="report in store.reports"
        :key="report.reportId"
        type="button"
        class="w-full rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-left shadow-(--shadow-sm)"
        @click="router.push(`/admin/diary-reports/${report.reportId}`)"
      >
        <div class="flex items-center justify-between gap-(--space-3)">
          <span class="rounded-full bg-(--color-danger-soft) px-(--space-2) py-1 text-(length:--font-xs) font-bold text-(color:--color-danger-strong)">
            {{ reasonLabels[report.reason] ?? report.reason }}
          </span>
          <span class="text-(length:--font-xs) text-(color:--color-slate-muted)">{{ formatDate(report.createdAt) }}</span>
        </div>
        <strong class="mt-(--space-3) block text-(length:--font-md) text-(color:--color-navy)">{{ report.petName }}의 게시물</strong>
        <p class="mt-(--space-2) line-clamp-2 text-(length:--font-sm) leading-relaxed text-(color:--color-slate-dark)">
          {{ report.contentPreview || '내용 없음' }}
        </p>
        <p class="mt-(--space-3) text-(length:--font-xs) text-(color:--color-slate-muted)">
          신고자 {{ report.reporterName }} · 작성자 {{ report.authorName }}
        </p>
      </button>
    </section>

    <nav
      v-if="!store.isLoading && store.reports.length"
      class="mt-(--space-5) flex items-center justify-center gap-(--space-3)"
      aria-label="신고 목록 페이지"
    >
      <button
        type="button"
        class="rounded-full bg-(--color-white) px-(--space-4) py-(--space-2) font-bold disabled:opacity-40"
        :disabled="store.page === 0"
        @click="store.fetchReports({ page: store.page - 1 })"
      >
        이전
      </button>
      <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">{{ store.page + 1 }}페이지</span>
      <button
        type="button"
        class="rounded-full bg-(--color-white) px-(--space-4) py-(--space-2) font-bold disabled:opacity-40"
        :disabled="!store.hasNext"
        @click="store.fetchReports({ page: store.page + 1 })"
      >
        다음
      </button>
    </nav>
  </main>
</template>
