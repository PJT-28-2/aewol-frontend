<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminDiaryReportStore } from '@/stores/adminDiaryReport'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminDiaryReportStore()
const adminNote = ref('')

const reasonLabels = {
  SPAM: '스팸·홍보', ABUSE: '욕설·괴롭힘', SEXUAL: '음란물', PRIVACY: '개인정보 노출', ETC: '기타',
}

async function resolve(resolution) {
  const succeeded = await store.resolveReport(String(route.params.reportId), resolution, adminNote.value)
  if (succeeded) await router.push('/admin/diary-reports')
}

onMounted(() => store.fetchReport(String(route.params.reportId)))
</script>

<template>
  <main class="min-h-full bg-(--color-app-bg) px-(--space-4) pb-(--space-8) pt-(--space-4)">
    <div
      v-if="store.isLoading"
      class="py-(--space-10)"
    >
      <LoadingSpinner />
    </div>
    <div
      v-else-if="store.error"
      class="rounded-(--radius-xl) bg-(--color-danger-soft) p-(--space-4)"
      role="alert"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong)">
        {{ store.error }}
      </p>
      <AppButton
        class="mt-(--space-3)"
        size="sm"
        @click="store.fetchReport(String(route.params.reportId))"
      >
        다시 시도
      </AppButton>
    </div>
    <template v-else-if="store.selectedReport">
      <header>
        <p class="text-(length:--font-xs) font-bold text-(color:--color-danger-strong)">
          신고 #{{ store.selectedReport.reportId }}
        </p>
        <h1 class="mt-(--space-1) text-(length:--font-xl) font-extrabold text-(color:--color-navy)">
          {{ store.selectedReport.petName }}의 신고 게시물
        </h1>
      </header>

      <section class="mt-(--space-5) rounded-(--radius-2xl) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
        <div
          v-if="store.selectedReport.images?.length"
          class="grid grid-cols-2 gap-(--space-2)"
        >
          <img
            v-for="image in store.selectedReport.images"
            :key="image"
            :src="image"
            alt="신고된 게시물 사진"
            class="aspect-square w-full rounded-(--radius-xl) object-cover"
          >
        </div>
        <p class="mt-(--space-4) whitespace-pre-wrap text-(length:--font-sm) leading-relaxed text-(color:--color-navy)">
          {{ store.selectedReport.content || '내용 없음' }}
        </p>
        <dl class="mt-(--space-4) grid grid-cols-[auto_1fr] gap-x-(--space-3) gap-y-(--space-2) text-(length:--font-sm)">
          <dt class="text-(color:--color-slate-muted)">
            신고 사유
          </dt><dd class="font-bold text-(color:--color-danger-strong)">
            {{ reasonLabels[store.selectedReport.reason] ?? store.selectedReport.reason }}
          </dd>
          <dt class="text-(color:--color-slate-muted)">
            신고자
          </dt><dd>{{ store.selectedReport.reporterName }} · {{ store.selectedReport.reporterEmail }}</dd>
          <dt class="text-(color:--color-slate-muted)">
            작성자
          </dt><dd>{{ store.selectedReport.authorName }}</dd>
          <dt class="text-(color:--color-slate-muted)">
            문의 번호
          </dt><dd>{{ store.selectedReport.inquiryNumber || '-' }}</dd>
        </dl>
      </section>

      <section
        v-if="store.selectedReport.status === 'PENDING'"
        class="mt-(--space-4) rounded-(--radius-2xl) bg-(--color-white) p-(--space-4)"
      >
        <label
          for="admin-note"
          class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
        >관리자 메모</label>
        <textarea
          id="admin-note"
          v-model="adminNote"
          maxlength="500"
          rows="4"
          class="mt-(--space-2) w-full resize-none rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus:border-(--color-leaf)"
          placeholder="처리 근거를 남겨주세요 (선택)"
        />
        <p
          v-if="store.operationError"
          class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ store.operationError }}
        </p>
        <div class="mt-(--space-4) grid grid-cols-2 gap-(--space-2)">
          <AppButton
            variant="danger"
            :loading="store.isSubmitting"
            :disabled="store.isSubmitting"
            @click="resolve('KEEP_HIDDEN')"
          >
            숨김 유지
          </AppButton>
          <AppButton
            variant="secondary"
            :loading="store.isSubmitting"
            :disabled="store.isSubmitting"
            @click="resolve('RESTORE')"
          >
            게시물 복원
          </AppButton>
        </div>
      </section>
      <section
        v-else
        class="mt-(--space-4) rounded-(--radius-xl) bg-(--color-leaf-soft) p-(--space-4)"
      >
        <p class="font-bold text-(color:--color-navy)">
          {{ store.selectedReport.resolution === 'RESTORE' ? '게시물 복원 완료' : '게시물 숨김 유지 완료' }}
        </p>
        <p
          v-if="store.selectedReport.adminNote"
          class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-dark)"
        >
          {{ store.selectedReport.adminNote }}
        </p>
      </section>
    </template>
  </main>
</template>
