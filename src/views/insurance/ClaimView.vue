<script setup>
import { ref } from 'vue'

const step = ref(1) // 1: upload, 2: OCR preview, 3: confirm
const receiptFile = ref(null)
const receiptPreview = ref('')
const ocrResult = ref({
  merchantName: '',
  amount: 0,
  date: '',
  items: [],
})
const isProcessing = ref(false)
const errorMessage = ref('')

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    receiptFile.value = file
    receiptPreview.value = URL.createObjectURL(file)
  }
}

const handleUpload = async () => {
  // TODO: implement receipt upload and OCR processing
  step.value = 2
}

const handleConfirm = async () => {
  // TODO: implement claim submission
}
</script>

<template>
  <div class="claim-page">
    <header class="page-header">
      <h1>보험 청구</h1>
    </header>

    <!-- Step 1: Receipt Upload -->
    <section v-if="step === 1" class="upload-section">
      <p class="step-description">영수증 사진을 업로드하세요.</p>

      <div class="upload-area" @click="$refs.fileInput.click()">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="file-input"
          @change="handleFileSelect"
        />
        <div v-if="!receiptPreview" class="upload-placeholder">
          <div class="upload-icon"><!-- TODO: camera icon --></div>
          <p>탭하여 영수증 촬영 또는 선택</p>
        </div>
        <img v-else :src="receiptPreview" alt="영수증 미리보기" class="receipt-preview" />
      </div>

      <button
        class="btn-primary"
        :disabled="!receiptFile || isProcessing"
        @click="handleUpload"
      >
        {{ isProcessing ? 'OCR 처리 중...' : 'OCR 분석하기' }}
      </button>
    </section>

    <!-- Step 2: OCR Result Preview -->
    <section v-else-if="step === 2" class="ocr-section">
      <p class="step-description">OCR 분석 결과를 확인하고 수정하세요.</p>

      <div class="ocr-result card">
        <div class="form-group">
          <label for="merchantName">가맹점명</label>
          <input id="merchantName" v-model="ocrResult.merchantName" type="text" />
        </div>
        <div class="form-group">
          <label for="amount">금액</label>
          <input id="amount" v-model.number="ocrResult.amount" type="number" />
        </div>
        <div class="form-group">
          <label for="date">날짜</label>
          <input id="date" v-model="ocrResult.date" type="date" />
        </div>

        <!-- TODO: implement line items editor -->
        <ul v-if="ocrResult.items.length > 0" class="item-list">
          <li v-for="(item, idx) in ocrResult.items" :key="idx">
            {{ item.name }} - {{ item.amount?.toLocaleString() }}원
          </li>
        </ul>
      </div>

      <div class="step-actions">
        <button class="btn-secondary" @click="step = 1">다시 촬영</button>
        <button class="btn-primary" @click="step = 3">확인</button>
      </div>
    </section>

    <!-- Step 3: Confirm & Submit -->
    <section v-else class="confirm-section">
      <p class="step-description">아래 내용으로 보험 청구를 제출합니다.</p>

      <div class="confirm-card card">
        <div class="confirm-row">
          <span>가맹점</span>
          <strong>{{ ocrResult.merchantName }}</strong>
        </div>
        <div class="confirm-row">
          <span>금액</span>
          <strong>{{ ocrResult.amount?.toLocaleString() }}원</strong>
        </div>
        <div class="confirm-row">
          <span>날짜</span>
          <strong>{{ ocrResult.date }}</strong>
        </div>
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="step-actions">
        <button class="btn-secondary" @click="step = 2">수정</button>
        <button class="btn-primary" :disabled="isProcessing" @click="handleConfirm">
          {{ isProcessing ? '제출 중...' : '청구 제출' }}
        </button>
      </div>
    </section>

    <!-- Step Indicator -->
    <div class="step-indicator">
      <span :class="{ active: step >= 1 }">1</span>
      <span :class="{ active: step >= 2 }">2</span>
      <span :class="{ active: step >= 3 }">3</span>
    </div>
  </div>
</template>

<style scoped>
.claim-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.step-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-bottom: var(--space-5);
}

.upload-area {
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  text-align: center;
  cursor: pointer;
  margin-bottom: var(--space-5);
  background-color: var(--color-white);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-input {
  display: none;
}

.upload-placeholder {
  color: var(--color-gray-500);
}

.upload-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  margin: 0 auto var(--space-3);
}

.upload-placeholder p {
  font-size: var(--font-md);
}

.receipt-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-1);
}

.form-group input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: var(--space-3) 0 0;
}

.item-list li {
  padding: var(--space-2) 0;
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  border-bottom: 1px solid var(--color-gray-100);
}

.confirm-card {
  margin-bottom: var(--space-5);
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: var(--font-md);
}

.confirm-row span {
  color: var(--color-gray-600);
}

.confirm-row strong {
  color: var(--color-gray-900);
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-sm);
  margin-bottom: var(--space-3);
}

.step-actions {
  display: flex;
  gap: var(--space-3);
}

.btn-primary {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-gray-600);
  cursor: pointer;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-7);
}

.step-indicator span {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  background-color: var(--color-gray-200);
  color: var(--color-gray-500);
}

.step-indicator span.active {
  background-color: var(--color-navy);
  color: var(--color-white);
}
</style>
