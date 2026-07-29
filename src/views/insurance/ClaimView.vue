<script setup>
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const step = ref(1) // 1: 서류 작성, 2: OCR 확인, 3: 초안

const receiptFile = ref(null)
const receiptFileName = ref('')

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  receiptFile.value = file
  receiptFileName.value = file.name
  step.value = 2
}
</script>

<template>
  <!-- Step 1: 보험금 청구 서류 작성 -->
  <div
    v-if="step === 1"
    class="min-h-screen bg-(--color-bg) px-(--space-5) pt-(--space-6) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <!-- 페이지 헤더 -->
    <header class="mb-(--space-6)">
      <div class="w-5 h-5 rounded-(--radius-sm) bg-(--color-navy) mb-(--space-3)" aria-hidden="true" />
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug mb-(--space-2)">
        보험금 청구 서류 작성
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) leading-relaxed">
        진료 영수증을 업로드하면 AI가 항목을 자동으로 인식해<br />
        서류 초안을 만들어드려요
      </p>
    </header>

    <!-- 업로드 섹션 카드 -->
    <section class="bg-(--color-gray-100) rounded-(--radius-xl) p-(--space-5)">
      <!-- 섹션 헤더 -->
      <div class="flex items-center gap-(--space-2) mb-(--space-2)">
        <div class="w-3.5 h-3.5 rounded-(--radius-sm) bg-(--color-navy) shrink-0" aria-hidden="true" />
        <span class="text-(length:--font-base) font-bold text-(color:--color-navy)">
          진료 영수증 업로드
        </span>
      </div>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) leading-relaxed mb-(--space-4)">
        AI가 항목을 자동으로 인식해 서류 초안을 만들어드려요
      </p>

      <!-- 파일 첨부 버튼 -->
      <label
        for="receipt-input"
        class="flex items-center justify-center w-full py-(--space-4) px-(--space-5) bg-(--color-white) border border-(--color-gray-400) rounded-(--radius-lg) cursor-pointer"
      >
        <input
          id="receipt-input"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleFileSelect"
        />
        <span class="text-(length:--font-base) font-medium text-(color:--color-gray-700)">
          {{ receiptFileName || '+ 영수증 이미지 첨부' }}
        </span>
      </label>
    </section>
  </div>

  <!-- Step 2: 보험금 청구 서류 확인 (추후 구현) -->
  <div
    v-else-if="step === 2"
    class="min-h-screen bg-(--color-bg) px-(--space-5) pt-(--space-6) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <header class="mb-(--space-6)">
      <div class="w-5 h-5 rounded-(--radius-sm) bg-(--color-navy) mb-(--space-3)" aria-hidden="true" />
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug mb-(--space-2)">
        보험금 청구 서류 확인
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        AI가 인식한 항목을 확인해주세요
      </p>
    </header>
    <!-- TODO: Step 2 구현 -->
    <AppButton block @click="step = 3">서류 초안 생성하기</AppButton>
  </div>

  <!-- Step 3: 보험금 청구 서류 초안 (추후 구현) -->
  <div
    v-else
    class="min-h-screen bg-(--color-bg) px-(--space-5) pt-(--space-6) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <header class="mb-(--space-6)">
      <div class="w-5 h-5 rounded-(--radius-sm) bg-(--color-navy) mb-(--space-3)" aria-hidden="true" />
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug mb-(--space-2)">
        보험금 청구 서류 초안
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        영수증 정보로 자동 작성했어요 · 부족한 항목만 채워주세요
      </p>
    </header>
    <!-- TODO: Step 3 구현 -->
  </div>
</template>
