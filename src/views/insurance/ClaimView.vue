<script setup>
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const step = ref(1) // 1: 서류 작성, 2: OCR 확인, 3: 초안

const receiptFile = ref(null)
const receiptFileName = ref('')

// OCR 추출 결과 (실제 연동 전 임시 데이터)
const ocrItems = ref([
  { key: 'date',      label: '진료일',   value: '2026.07.10' },
  { key: 'hospital',  label: '병원명',   value: '24시 제주동물의료센터' },
  { key: 'treatment', label: '진료 항목', value: '슬개골 탈구 치료' },
  { key: 'fee',       label: '진료비',   value: '168,000원' },
])
const editingKey = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  receiptFile.value = file
  receiptFileName.value = file.name
  step.value = 2
}

const startEdit = (key) => {
  editingKey.value = key
}

const finishEdit = () => {
  editingKey.value = null
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

  <!-- Step 2: 보험금 청구 서류 확인 -->
  <div
    v-else-if="step === 2"
    class="min-h-screen bg-(--color-bg) px-(--space-5) pt-(--space-6) pb-[calc(var(--bottom-nav-height)+var(--space-6))]"
  >
    <!-- 페이지 헤더 -->
    <header class="mb-(--space-6)">
      <div class="w-5 h-5 rounded-(--radius-sm) bg-(--color-navy) mb-(--space-3)" aria-hidden="true" />
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) leading-snug mb-(--space-2)">
        보험금 청구 서류 확인
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        AI가 인식한 항목을 확인해주세요
      </p>
    </header>

    <!-- OCR 결과 카드 -->
    <section class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) shadow-(--shadow-md) mb-(--space-5)">
      <!-- 파일 정보 -->
      <div class="mb-(--space-4)">
        <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
          {{ receiptFileName || '진료 영수증.jpg' }}
        </p>
        <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-2)">
          OCR 인식 완료 · Gemini Vision
        </p>
        <span
          class="inline-block text-(length:--font-xs) font-semibold px-(--space-3) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)"
        >
          인식 완료
        </span>
      </div>

      <!-- 구분선 -->
      <div class="h-px bg-(--color-gray-200) mb-(--space-4)" />

      <!-- 추출 항목 헤더 -->
      <div class="flex justify-between items-center mb-(--space-3)">
        <span class="text-(length:--font-sm) font-semibold text-(color:--color-gray-700)">추출된 항목</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-500)">탭해서 수정</span>
      </div>

      <!-- 항목 리스트 -->
      <ul class="divide-y divide-(--color-gray-100)">
        <li
          v-for="item in ocrItems"
          :key="item.key"
          class="flex items-center justify-between py-(--space-3) gap-(--space-3)"
          @click="startEdit(item.key)"
        >
          <span class="text-(length:--font-md) text-(color:--color-gray-600) shrink-0">
            {{ item.label }}
          </span>
          <input
            v-if="editingKey === item.key"
            v-model="item.value"
            class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right border-b border-(--color-navy) outline-none bg-transparent w-full"
            @blur="finishEdit"
            @keyup.enter="finishEdit"
            autofocus
          />
          <span
            v-else
            class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right"
          >
            {{ item.value }}
          </span>
        </li>
      </ul>
    </section>

    <!-- 서류 초안 생성 버튼 -->
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
