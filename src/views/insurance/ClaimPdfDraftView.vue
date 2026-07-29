<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useInsuranceStore } from '@/stores/insurance'

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
  { key: 'hospitalName',  label: '병원명' },
  { key: 'visitDate',     label: '진료일자' },
  { key: 'claimAmount',   label: '청구금액' },
  { key: 'diagnosis',     label: '진단명' },
  { key: 'accountInfo',   label: '계좌정보' },
]
const missingFields = computed(() =>
  REQUIRED_FIELDS.filter((f) => !claimData.value[f.key]).map((f) => f.label),
)
const canDownload = computed(() => missingFields.value.length === 0)

const isGenerating = ref(false)

const previewRef = ref(null)

const handleDownload = async () => {
  if (!canDownload.value) return
  isGenerating.value = true
  try {
    const canvas = await html2canvas(previewRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 10
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2
    // 종횡비 유지: 가로 기준으로 높이 계산
    const imgHeight = (canvas.height * contentWidth) / canvas.width
    // 페이지 분할: A4 한 장에 들어오는 이미지 높이(mm)만큼 잘라서 각 페이지에 삽입
    const totalPages = Math.ceil(imgHeight / contentHeight)
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()
      pdf.addImage(
        imgData, 'PNG',
        margin,
        margin - page * contentHeight,
        contentWidth,
        imgHeight,
      )
    }
    pdf.save(`보험금청구서_${claimData.value.hospitalName}_${claimData.value.visitDate}.pdf`)
  } finally {
    isGenerating.value = false
  }
}

const goBack = () => {
  router.push({ path: '/insurance/claim', query: { step: '3' } })
}
</script>

<template>
  <div class="min-h-screen bg-(--color-gray-100) flex flex-col">

    <!-- 상단 헤더 -->
    <header class="print:hidden sticky top-0 z-10 flex items-center h-(--header-height) px-(--space-4) bg-(--color-white) border-b border-(--color-border)">
      <button
        type="button"
        aria-label="뒤로가기"
        class="flex items-center justify-center w-10 h-10 text-(color:--color-navy)"
        @click="goBack"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1 class="flex-1 text-center text-(length:--font-base) font-semibold text-(color:--color-navy)">
        PDF 초안 미리보기
      </h1>
      <div class="w-10" />
    </header>

    <!-- PDF 미리보기 영역 -->
    <div class="flex-1 p-(--space-5) px-(--space-4) pb-[calc(80px+var(--space-5))] overflow-y-auto">
      <div ref="previewRef" class="bg-(--color-white) rounded-(--radius-lg) [box-shadow:var(--shadow-md)] p-(--space-6) max-w-[480px] mx-auto">

        <!-- PDF 헤더 -->
        <div class="flex items-center gap-(--space-4) mb-(--space-5)">
          <div class="flex items-center gap-(--space-2)">
            <div class="w-10 h-10 rounded-full bg-(--color-olive-surface) flex items-center justify-center text-xl">
              🐾
            </div>
            <span class="text-(length:--font-lg) font-bold text-(color:--color-navy)">애월</span>
          </div>
          <div class="ml-auto text-right">
            <p class="text-(length:--font-lg) font-bold text-(color:--color-navy)">보험금 청구서</p>
            <p class="text-(length:--font-xs) text-(color:--color-slate) mt-(--space-1)">Insurance Claim Form</p>
          </div>
        </div>

        <!-- 구분선 -->
        <div class="h-0.5 rounded-full mb-(--space-5) [background:linear-gradient(to_right,var(--color-navy),var(--color-gold))]" />

        <!-- 청구 정보 -->
        <ul class="mb-(--space-5)">
          <li
            v-for="row in [
              { label: '병원명',     value: claimData.hospitalName,   extra: null },
              { label: '진료일자',   value: claimData.visitDate,      extra: null },
              { label: '청구금액',   value: claimData.claimAmount, extra: 'amount' },
              { label: '사업자번호', value: claimData.businessNumber,  extra: 'biz' },
              { label: '진단명',     value: claimData.diagnosis,      extra: null },
              { label: '계약자 정보', value: claimData.ownerName || '미입력', extra: null },
              { label: '계좌정보',   value: claimData.accountInfo,    extra: null },
            ]"
            :key="row.label"
            class="flex items-center py-(--space-3) border-b border-(--color-border) last:border-0"
          >
            <span class="w-[40%] text-(length:--font-sm) text-(color:--color-gray-600) font-medium">{{ row.label }}</span>
            <span
              class="flex-1 text-right font-semibold"
              :class="row.extra === 'amount'
                ? 'text-(length:--font-base) text-(color:--color-navy)'
                : row.extra === 'biz' && !row.value
                  ? 'text-(length:--font-sm) text-(color:--color-gold-dark) font-medium'
                  : 'text-(length:--font-sm) text-(color:--color-gray-900)'"
            >
              {{ row.extra === 'biz' && !row.value ? '직접 확인 필요' : row.value }}
            </span>
          </li>
        </ul>

        <!-- 미확인 항목 경고 -->
        <div v-if="!claimData.businessNumber" class="flex gap-(--space-3) bg-(--color-gold-surface) rounded-(--radius-md) p-(--space-4) mb-(--space-5)">
          <span class="text-(length:--font-lg) shrink-0">⚠</span>
          <div>
            <p class="text-(length:--font-sm) font-semibold text-(color:--color-gold-dark) mb-(--space-1)">직접 확인이 필요한 항목이 있어요</p>
            <p class="text-(length:--font-xs) text-(color:--color-gray-600) leading-relaxed">사업자번호는 영수증에서 직접 확인 후 기입해 주세요.</p>
          </div>
        </div>

        <!-- PDF 푸터 -->
        <div class="border-t border-(--color-border) pt-(--space-4) text-center">
          <p class="text-(length:--font-xs) text-(color:--color-gray-500)">본 청구서는 애월 앱에서 자동 생성된 초안입니다.</p>
          <p class="text-(length:--font-xs) text-(color:--color-gray-400) mt-(--space-1)">
            생성일: {{ new Date().toLocaleDateString('ko-KR') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 하단 다운로드 버튼 -->
    <div class="print:hidden fixed bottom-(--bottom-nav-height) left-0 right-0 px-(--space-4) pt-(--space-3) pb-(--space-4) bg-(--color-white) border-t border-(--color-border)">
      <!-- 필수값 누락 안내 -->
      <p v-if="missingFields.length > 0" class="text-(length:--font-xs) text-(color:--color-danger) text-center mb-(--space-2)">
        누락된 항목이 있어요: {{ missingFields.join(', ') }} · 이전 화면에서 채워주세요
      </p>
      <button
        type="button"
        class="w-full h-(--control-height-lg) bg-(--color-navy) text-(color:--color-white) border-none rounded-(--radius-lg) text-(length:--font-base) font-semibold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:opacity-85"
        :disabled="isGenerating || !canDownload"
        @click="handleDownload"
      >
        <span v-if="isGenerating">PDF 생성 중...</span>
        <span v-else>PDF 저장</span>
      </button>
    </div>
  </div>
</template>
