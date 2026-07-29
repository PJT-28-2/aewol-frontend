<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 이슈 #37 완성 후 실제 데이터로 교체될 mock 데이터
const claimData = ref({
  hospitalName: route.query.hospitalName || '24시 제주동물의료센터',
  visitDate: route.query.visitDate || '2026.07.10',
  claimAmount: route.query.claimAmount || '168,000',
  businessNumber: route.query.businessNumber || null, // null = 확인필요
  diagnosis: route.query.diagnosis || '슬개골 탈구 치료',
  accountInfo: route.query.accountInfo || '프로필 연동',
  petName: route.query.petName || '루나',
  ownerName: route.query.ownerName || '홍길동',
})

const isGenerating = ref(false)
const jsPDFLoaded = ref(false)
const html2canvasLoaded = ref(false)

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

onMounted(async () => {
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(
      () => (jsPDFLoaded.value = true),
    ),
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    ).then(() => (html2canvasLoaded.value = true)),
  ])
})

const previewRef = ref(null)

const handleDownload = async () => {
  if (!jsPDFLoaded.value || !html2canvasLoaded.value) return
  isGenerating.value = true

  try {
    const { jsPDF } = window.jspdf
    const canvas = await window.html2canvas(previewRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20))

    const fileName = `보험금청구서_${claimData.value.hospitalName}_${claimData.value.visitDate}.pdf`
    pdf.save(fileName)
  } finally {
    isGenerating.value = false
  }
}

const goBack = () => router.back()
</script>

<template>
  <div class="pdf-draft-page">
    <!-- 상단 헤더 (인쇄 시 숨김) -->
    <header class="page-header no-print">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <h1 class="header-title">PDF 초안 미리보기</h1>
      <div class="header-spacer" />
    </header>

    <!-- PDF 미리보기 영역 -->
    <div class="preview-wrapper">
      <div ref="previewRef" class="pdf-preview">
        <!-- PDF 헤더 -->
        <div class="pdf-header">
          <div class="pdf-logo-area">
            <div class="pdf-logo-circle">🐾</div>
            <span class="pdf-logo-text">애월</span>
          </div>
          <div class="pdf-title-area">
            <h2 class="pdf-title">보험금 청구서</h2>
            <p class="pdf-subtitle">Insurance Claim Form</p>
          </div>
        </div>

        <div class="pdf-divider" />

        <!-- 청구 정보 테이블 -->
        <table class="pdf-table">
          <tbody>
            <tr>
              <td class="label-cell">병원명</td>
              <td class="value-cell">{{ claimData.hospitalName }}</td>
            </tr>
            <tr>
              <td class="label-cell">진료일자</td>
              <td class="value-cell">{{ claimData.visitDate }}</td>
            </tr>
            <tr>
              <td class="label-cell">청구금액</td>
              <td class="value-cell amount-value">{{ claimData.claimAmount }}원</td>
            </tr>
            <tr>
              <td class="label-cell">사업자번호</td>
              <td class="value-cell">
                <span v-if="claimData.businessNumber">{{ claimData.businessNumber }}</span>
                <span v-else class="unconfirmed-text">직접 확인 필요</span>
              </td>
            </tr>
            <tr>
              <td class="label-cell">진단명</td>
              <td class="value-cell">{{ claimData.diagnosis }}</td>
            </tr>
            <tr>
              <td class="label-cell">계약자 정보</td>
              <td class="value-cell">{{ claimData.ownerName }}</td>
            </tr>
            <tr>
              <td class="label-cell">계좌정보</td>
              <td class="value-cell">{{ claimData.accountInfo }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 미확인 항목 안내 -->
        <div v-if="!claimData.businessNumber" class="warning-box">
          <span class="warning-icon">⚠</span>
          <div class="warning-text">
            <p class="warning-title">직접 확인이 필요한 항목이 있어요</p>
            <p class="warning-desc">사업자번호는 영수증에서 직접 확인 후 기입해 주세요.</p>
          </div>
        </div>

        <!-- PDF 푸터 -->
        <div class="pdf-footer">
          <p class="pdf-footer-text">본 청구서는 애월 앱에서 자동 생성된 초안입니다.</p>
          <p class="pdf-footer-date">생성일: {{ new Date().toLocaleDateString('ko-KR') }}</p>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 (인쇄 시 숨김) -->
    <div class="bottom-action no-print">
      <button
        class="download-btn"
        :disabled="isGenerating || !jsPDFLoaded || !html2canvasLoaded"
        @click="handleDownload"
      >
        <span v-if="isGenerating">PDF 생성 중...</span>
        <span v-else-if="!jsPDFLoaded || !html2canvasLoaded">로딩 중...</span>
        <span v-else>PDF 저장</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pdf-draft-page {
  min-height: 100vh;
  background-color: var(--color-gray-100);
  display: flex;
  flex-direction: column;
}

/* 헤더 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 var(--space-4);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-border);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-navy);
  padding: 0;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
}

.header-spacer {
  width: 40px;
}

/* 미리보기 래퍼 */
.preview-wrapper {
  flex: 1;
  padding: var(--space-5) var(--space-4);
  padding-bottom: calc(80px + var(--space-5));
  overflow-y: auto;
}

/* PDF 미리보기 카드 */
.pdf-preview {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  max-width: 480px;
  margin: 0 auto;
}

/* PDF 헤더 */
.pdf-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.pdf-logo-area {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pdf-logo-circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-olive-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.pdf-logo-text {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.pdf-title-area {
  margin-left: auto;
  text-align: right;
}

.pdf-title {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.pdf-subtitle {
  font-size: var(--font-xs);
  color: var(--color-slate);
  margin-top: var(--space-1);
}

.pdf-divider {
  height: 2px;
  background: linear-gradient(to right, var(--color-navy), var(--color-gold));
  border-radius: var(--radius-full);
  margin-bottom: var(--space-5);
}

/* 테이블 */
.pdf-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--space-5);
}

.pdf-table tr {
  border-bottom: 1px solid var(--color-border);
}

.pdf-table tr:last-child {
  border-bottom: none;
}

.label-cell {
  padding: var(--space-3) var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  font-weight: var(--font-medium);
  width: 40%;
  vertical-align: middle;
}

.value-cell {
  padding: var(--space-3) var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-gray-900);
  font-weight: var(--font-semibold);
  text-align: right;
  vertical-align: middle;
}

.amount-value {
  font-size: var(--font-base);
  color: var(--color-navy);
}

.unconfirmed-text {
  color: var(--color-gold-dark);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

/* 경고 박스 */
.warning-box {
  display: flex;
  gap: var(--space-3);
  background-color: var(--color-gold-surface);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
}

.warning-icon {
  font-size: var(--font-lg);
  flex-shrink: 0;
}

.warning-title {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gold-dark);
  margin-bottom: var(--space-1);
}

.warning-desc {
  font-size: var(--font-xs);
  color: var(--color-gray-600);
  line-height: 1.5;
}

/* PDF 푸터 */
.pdf-footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
  text-align: center;
}

.pdf-footer-text {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
}

.pdf-footer-date {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
  margin-top: var(--space-1);
}

/* 하단 버튼 */
.bottom-action {
  position: fixed;
  bottom: var(--bottom-nav-height);
  left: 0;
  right: 0;
  padding: var(--space-4);
  background-color: var(--color-white);
  border-top: 1px solid var(--color-border);
}

.download-btn {
  width: 100%;
  height: var(--control-height-lg);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: opacity 0.2s;
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.download-btn:not(:disabled):active {
  opacity: 0.85;
}

/* 인쇄 시 불필요한 요소 숨김 (fallback) */
@media print {
  .no-print {
    display: none !important;
  }

  .pdf-draft-page {
    background: white;
  }

  .preview-wrapper {
    padding: 0;
  }

  .pdf-preview {
    box-shadow: none;
    border-radius: 0;
  }
}
</style>
