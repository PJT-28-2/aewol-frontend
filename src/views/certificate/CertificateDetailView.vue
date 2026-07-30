<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useCertificateStore } from '@/stores/certificate'
import { formatDateDot } from '@/utils/date'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'

const route = useRoute()
const router = useRouter()
const certificateStore = useCertificateStore()

onMounted(async () => {
  // registrationDetails는 fetchPets()가 목데이터를 스토어 상태로 옮겨야 채워지는데,
  // 목록 화면을 거치지 않고 이 화면으로 바로 진입(새로고침·직접 접속 등)하면 비어있을 수 있어
  // 먼저 보장해준다.
  if (certificateStore.pets.length === 0) {
    await certificateStore.fetchPets()
  }
  await certificateStore.fetchCertificateDetail(route.params.docId)
})

const genderText = computed(() => {
  const detail = certificateStore.detail
  if (!detail) return ''
  const genderLabel = detail.gender === 'FEMALE' ? '암컷' : '수컷'
  const neuteredLabel = detail.neutered === 'Y' ? '중성화 완료' : '중성화 안함'
  return `${genderLabel}(${neuteredLabel})`
})

const infoRows = computed(() => {
  const detail = certificateStore.detail
  if (!detail) return []
  return [
    { label: '등록번호', value: detail.regNumber },
    { label: '동물명', value: detail.name },
    { label: '품종', value: detail.breed },
    { label: '성별', value: genderText.value },
    { label: '출생연월일', value: formatDateDot(detail.birthDate) },
    { label: '털색', value: detail.furColor },
    { label: '체중', value: `${detail.weight}kg` },
    { label: '소유자', value: detail.ownerName },
    { label: '등록일', value: formatDateDot(detail.registerDate) },
    { label: '발급일자', value: formatDateDot(detail.issueDate) },
    { label: '발급기관', value: detail.issueOrg },
  ]
})

// PDF 저장 / 공유하기 — 백엔드 API 없이 화면에 그려진 카드를 캡처해 클라이언트에서만 처리
const detailCardRef = ref(null)
const isGeneratingPdf = ref(false)
const isSharing = ref(false)
const showSavedModal = ref(false)
const showShareFallbackModal = ref(false)

async function captureCard() {
  return html2canvas(detailCardRef.value, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })
}

async function handleDownloadPdf() {
  isGeneratingPdf.value = true
  try {
    const canvas = await captureCard()
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 10
    const pageWidth = pdf.internal.pageSize.getWidth()
    const contentWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * contentWidth) / canvas.width
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, imgHeight)
    pdf.save(`동물등록증_${certificateStore.detail?.name ?? ''}.pdf`)
    showSavedModal.value = true
  } finally {
    isGeneratingPdf.value = false
  }
}

async function handleShare() {
  isSharing.value = true
  try {
    const canvas = await captureCard()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    const file = new File(
      [blob],
      `동물등록증_${certificateStore.detail?.name ?? ''}.png`,
      { type: 'image/png' },
    )

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: '동물등록증',
        text: `${certificateStore.detail?.name ?? ''}의 동물등록증이에요`,
      })
      return
    }
    showShareFallbackModal.value = true
  } catch (err) {
    // 사용자가 공유시트를 취소한 경우는 안내가 필요 없음
    if (err?.name === 'AbortError') return
    showShareFallbackModal.value = true
  } finally {
    isSharing.value = false
  }
}

function handleShareFallbackConfirm() {
  showShareFallbackModal.value = false
  handleDownloadPdf()
}

// 재동기화 — connectedId 재사용 전제라 신원확인 폼 없이 바로 재조회
const isResyncing = ref(false)
const resyncError = ref('')

async function handleResync() {
  if (!certificateStore.detail) return
  resyncError.value = ''
  isResyncing.value = true
  try {
    await certificateStore.resyncRegistration(certificateStore.detail.docId)
  } catch {
    resyncError.value = '동기화에 실패했어요. 다시 시도해주세요.'
  } finally {
    isResyncing.value = false
  }
}

// 연동 해제(삭제)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

function openDeleteModal() {
  deleteError.value = ''
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!certificateStore.detail) return
  isDeleting.value = true
  try {
    await certificateStore.deleteRegistration(certificateStore.detail.docId)
    router.replace('/certificates')
  } catch {
    deleteError.value = '연동 해제에 실패했어요. 다시 시도해주세요.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]">
    <button
      type="button"
      class="mb-(--space-4) text-(color:--color-navy)"
      aria-label="뒤로가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="24" />
    </button>

    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        동물등록증
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        국가동물보호정보시스템(APMS) 연동 정보
      </p>
    </header>

    <LoadingSpinner
      v-if="certificateStore.isLoading"
      class="my-(--space-8)"
    />

    <template v-else-if="certificateStore.detail">
      <!-- 캡처 대상: PDF 저장/공유하기에서 그대로 이미지화 -->
      <div
        ref="detailCardRef"
        class="bg-(--color-navy) rounded-(--radius-xl) p-(--space-5) mb-(--space-4)"
      >
        <p class="text-center text-(length:--font-base) font-bold text-(color:--color-white) tracking-widest mb-(--space-4)">
          동 물 등 록 증
        </p>

        <div class="bg-(--color-white) rounded-(--radius-lg) p-(--space-4)">
          <ul>
            <li
              v-for="row in infoRows"
              :key="row.label"
              class="flex items-center py-(--space-3) border-b border-(--color-border) last:border-0"
            >
              <span class="w-[38%] text-(length:--font-sm) text-(color:--color-gray-600) font-medium">
                {{ row.label }}
              </span>
              <span class="flex-1 min-w-0 text-right text-(length:--font-sm) font-semibold text-(color:--color-gray-900) [overflow-wrap:anywhere]">
                {{ row.value }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 동기화 안내 -->
      <div class="flex items-start gap-(--space-2) bg-(--color-info-surface) rounded-(--radius-md) p-(--space-4) mb-(--space-5)">
        <IconInfo
          :size="16"
          color="var(--color-navy)"
          class="shrink-0 mt-[2px]"
        />
        <div class="flex-1">
          <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
            마지막 동기화: {{ formatDateDot(certificateStore.detail.lastSyncedAt) }}
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-gray-600) mt-(--space-1)">
            APMS 정보 변경 시 자동으로 갱신돼요
          </p>
          <p
            v-if="resyncError"
            class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-1)"
          >
            {{ resyncError }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 text-(length:--font-xs) font-semibold text-(color:--color-navy) underline underline-offset-2 disabled:opacity-50"
          :disabled="isResyncing"
          @click="handleResync"
        >
          {{ isResyncing ? '동기화 중…' : '지금 동기화' }}
        </button>
      </div>

      <!-- PDF 저장 / 공유하기 -->
      <div class="flex gap-(--space-3) mb-(--space-4)">
        <AppButton
          variant="secondary"
          size="lg"
          class="flex-1"
          :loading="isGeneratingPdf"
          @click="handleDownloadPdf"
        >
          PDF 저장
        </AppButton>
        <AppButton
          variant="navy"
          size="lg"
          class="flex-1"
          :loading="isSharing"
          @click="handleShare"
        >
          공유하기
        </AppButton>
      </div>

      <button
        type="button"
        class="w-full text-center text-(length:--font-sm) text-(color:--color-gray-500) underline underline-offset-2"
        @click="openDeleteModal"
      >
        동물등록증 연동 해제
      </button>
    </template>

    <!-- PDF 저장 완료 모달 -->
    <AppModal
      v-model="showSavedModal"
      title="PDF 저장 완료"
      :show-close="false"
    >
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        동물등록증 PDF가 저장되었어요.
      </p>
      <template #footer>
        <AppButton @click="showSavedModal = false">
          확인
        </AppButton>
      </template>
    </AppModal>

    <!-- 공유 미지원 기기 안내 모달 -->
    <AppModal
      v-model="showShareFallbackModal"
      title="공유가 지원되지 않아요"
      :show-close="false"
    >
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        이 기기·브라우저에서는 바로 공유할 수 없어요.<br>
        대신 PDF로 저장해드릴게요.
      </p>
      <template #footer>
        <AppButton @click="handleShareFallbackConfirm">
          PDF로 저장하기
        </AppButton>
      </template>
    </AppModal>

    <!-- 연동 해제 확인 모달 -->
    <AppModal
      v-model="showDeleteModal"
      title="동물등록증 연동을 해제할까요?"
    >
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        연동을 해제하면 저장된 등록정보가 삭제돼요. 해제 후에도 언제든 다시 연동할 수 있어요.
      </p>
      <p
        v-if="deleteError"
        class="text-(length:--font-sm) text-(color:--color-danger) mt-(--space-2)"
      >
        {{ deleteError }}
      </p>
      <template #footer>
        <AppButton
          variant="secondary"
          :disabled="isDeleting"
          @click="showDeleteModal = false"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          :loading="isDeleting"
          @click="handleDelete"
        >
          해제하기
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
