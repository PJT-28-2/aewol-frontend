<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useInsuranceStore } from '@/stores/insurance'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'

const router = useRouter()
const insuranceStore = useInsuranceStore()

const draft = insuranceStore.claimDraft ?? {}
const claimData = ref({
  hospitalName:   draft.hospitalName   || '',
  visitDate:      draft.visitDate      || '',
  claimAmount:    draft.claimAmount    || '',
  businessNumber: draft.businessNumber || '',
  diagnosis:      draft.diagnosis      || '',
  accountInfo:    draft.accountInfo    || '',
  ownerName:      draft.ownerName      || '',
})

// 필수 항목 누락 여부 (사업자번호는 경고만, 저장 차단 안 함)
const REQUIRED_FIELDS = [
  { key: 'hospitalName',   label: '병원명' },
  { key: 'visitDate',      label: '진료일자' },
  { key: 'claimAmount',    label: '청구금액' },
  { key: 'businessNumber', label: '사업자번호' },
  { key: 'diagnosis',      label: '진단명' },
  { key: 'accountInfo',    label: '계좌정보' },
]
const missingFields = computed(() =>
  REQUIRED_FIELDS.filter((f) => !claimData.value[f.key]?.trim()).map((f) => f.label),
)
const canDownload = computed(() => missingFields.value.length === 0)

const isGenerating = ref(false)
const showSuccessModal = ref(false)

const previewRef = ref(null)

const handleDownload = async () => {
  if (!canDownload.value) return
  isGenerating.value = true
  try {
    const white = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-white')
      .trim()
    const canvas = await html2canvas(previewRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: white,
    })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 10
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2
    // 1mm당 캔버스 픽셀 수
    const pxPerMm = canvas.width / contentWidth
    // 페이지 1장에 해당하는 캔버스 픽셀 높이
    const canvasPageHeight = Math.floor(contentHeight * pxPerMm)
    const totalPages = Math.ceil(canvas.height / canvasPageHeight)
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()
      const srcY = page * canvasPageHeight
      const srcH = Math.min(canvasPageHeight, canvas.height - srcY)
      // 페이지 슬라이스용 임시 캔버스
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = canvasPageHeight
      const ctx = slice.getContext('2d')
      ctx.fillStyle = white
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
      const sliceHeight = (slice.height / pxPerMm)
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeight)
    }
    pdf.save(`보험금청구서_${claimData.value.hospitalName}_${claimData.value.visitDate}.pdf`)

    // 청구 확인 및 제출 (claimId가 있을 때만, 실패해도 PDF 저장 성공 모달은 표시)
    if (draft.claimId) {
      const totalAmountRaw = claimData.value.claimAmount
        ? parseInt(String(claimData.value.claimAmount).replace(/[^0-9]/g, ''), 10) || null
        : null
      try {
        await insuranceStore.confirmClaim(draft.claimId, {
          hospitalName:  claimData.value.hospitalName || null,
          treatmentDate: claimData.value.visitDate    || null,
          totalAmount:   totalAmountRaw,
        })
      } catch (e) {
        console.error('[ClaimPdfDraft] 청구 확인 API 실패', e)
      }
    }

    showSuccessModal.value = true
  } finally {
    isGenerating.value = false
  }
}

const goToInsuranceHome = () => {
  showSuccessModal.value = false
  router.replace('/insurance')
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) flex flex-col">
    <!-- PDF 미리보기 영역 -->
    <div class="flex-1 p-(--space-5) px-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-5))] overflow-y-auto">
      <header class="mb-(--space-5) max-w-(--layout-max-width) mx-auto">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
          PDF 초안 미리보기
        </h1>
      </header>

      <div
        ref="previewRef"
        class="mx-auto max-w-(--layout-max-width) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-6) shadow-(--shadow-card)"
      >
        <!-- PDF 헤더 -->
        <div class="flex items-center gap-(--space-4) mb-(--space-5)">
          <div class="flex items-end text-(length:--font-xl) leading-none font-bold tracking-[-0.045em] text-(color:--color-gray-900)">
            AEWOL
          </div>
          <div class="ml-auto text-right">
            <p class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
              보험금 청구서
            </p>
            <p class="text-(length:--font-xs) text-(color:--color-slate) mt-(--space-1)">
              Insurance Claim Form
            </p>
          </div>
        </div>

        <!-- 구분선 -->
        <div class="h-0.5 rounded-full mb-(--space-5) bg-(--color-navy)" />

        <!-- 청구 정보 -->
        <ul class="mb-(--space-5)">
          <li
            v-for="row in [
              { label: '병원명', value: claimData.hospitalName, extra: null },
              { label: '진료일자', value: claimData.visitDate, extra: null },
              { label: '청구금액', value: claimData.claimAmount, extra: 'amount' },
              { label: '사업자번호', value: claimData.businessNumber, extra: 'biz' },
              { label: '진단명', value: claimData.diagnosis, extra: null },
              { label: '계약자 정보', value: claimData.ownerName || '미입력', extra: null },
              { label: '계좌정보', value: claimData.accountInfo, extra: null },
            ]"
            :key="row.label"
            class="flex items-center py-(--space-3) border-b border-(--color-border) last:border-0"
          >
            <span class="w-[40%] text-(length:--font-sm) text-(color:--color-gray-600) font-medium">{{ row.label }}</span>
            <span
              class="flex-1 min-w-0 text-right font-semibold [overflow-wrap:anywhere]"
              :class="row.extra === 'amount'
                ? 'text-(length:--font-sm) text-(color:--color-navy)'
                : row.extra === 'biz' && !row.value
                  ? 'text-(length:--font-sm) text-(color:--color-danger-strong) font-medium'
                  : 'text-(length:--font-sm) text-(color:--color-gray-900)'"
            >
              {{ row.extra === 'biz' && !row.value ? '직접 확인 필요' : row.value }}
            </span>
          </li>
        </ul>

        <!-- 미확인 항목 경고 -->
        <div
          v-if="!claimData.businessNumber"
          class="flex items-center gap-(--space-3) bg-(--color-gold-surface) rounded-(--radius-md) p-(--space-4) mb-(--space-5)"
        >
          <IconWarning
            size="20"
            color="var(--color-gold-dark)"
            class="shrink-0"
          />
          <div>
            <p class="text-(length:--font-sm) font-semibold text-(color:--color-gold-dark)">
              직접 확인이 필요한 항목이 있어요
            </p>
            <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">
              사업자번호는 영수증에서 직접 확인 후 기입해 주세요.
            </p>
          </div>
        </div>

        <!-- PDF 푸터 -->
        <div class="border-t border-(--color-border) pt-(--space-4) text-center">
          <p class="text-(length:--font-xs) text-(color:--color-gray-500)">
            본 청구서는 애월 앱에서 자동 생성된 초안입니다.
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-gray-400) mt-(--space-1)">
            생성일: {{ new Date().toLocaleDateString('ko-KR') }}
          </p>
        </div>
      </div>

      <!-- PDF 다운로드 버튼 -->
      <div class="print:hidden max-w-(--layout-max-width) mx-auto mt-(--space-5)">
        <!-- 필수값 누락 안내 -->
        <p
          v-if="missingFields.length > 0"
          class="text-(length:--font-xs) text-(color:--color-danger-strong) text-center mb-(--space-2)"
        >
          누락된 항목이 있어요: {{ missingFields.join(', ') }}<br>이전 화면으로 돌아가서 채워주세요
        </p>
        <AppButton
          type="button"
          variant="primary"
          size="lg"
          block
          :loading="isGenerating"
          :disabled="!canDownload"
          @click="handleDownload"
        >
          PDF 저장
        </AppButton>
      </div>
    </div>
  </div>

  <!-- 저장 완료 모달 -->
  <AppModal
    v-model="showSuccessModal"
    title="PDF 저장 완료"
    :show-close="false"
    :divider="false"
  >
    <div class="flex flex-col items-center text-center">
      <IconDocument
        size="48"
        class="mb-(--space-3)"
      />
      <p class="text-(length:--font-md) text-(color:--color-gray-600) leading-relaxed">
        보험금 청구서 PDF가 저장되었어요.<br>
        보험사에 제출 전 내용을 다시 한번 확인해 주세요.
      </p>
    </div>
    <template #footer>
      <AppButton
        variant="primary"
        size="lg"
        block
        class="!rounded-(--radius-lg)"
        @click="goToInsuranceHome"
      >
        확인
      </AppButton>
    </template>
  </AppModal>
</template>
