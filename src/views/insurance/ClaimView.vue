<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import OcrResultCard from '@/components/insurance/OcrResultCard.vue'
import ClaimDraftCard from '@/components/insurance/ClaimDraftCard.vue'
import ClaimChecklist from '@/components/insurance/ClaimChecklist.vue'

const router = useRouter()

const step = ref(1) // 1: 서류 작성, 2: OCR 확인, 3: 초안

const receiptFile = ref(null)
const receiptFileName = ref('')

// OCR 추출 결과 (실제 연동 전 임시 데이터)
const ocrItems = ref([
  { key: 'date',      label: '진료일',    value: '2026.07.10',         unit: '' },
  { key: 'hospital',  label: '병원명',    value: '24시 제주동물의료센터', unit: '' },
  { key: 'treatment', label: '진료 항목', value: '슬개골 탈구 치료',    unit: '' },
  { key: 'fee',       label: '진료비',    value: '168,000원',           unit: '원' },
])
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있어요.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하여야 해요.')
    return
  }
  receiptFile.value = file
  receiptFileName.value = file.name
  step.value = 2
}

// OCR 키 → 초안 필드 인덱스 매핑
const ocrKeyToDraftIndex = { hospital: 0, date: 1, fee: 2, treatment: 4 }

// 청구서 초안 필드
const draftFields = ref([
  { label: '병원명',          value: '', editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '진료일자',        value: '', editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '청구금액',        value: '', editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '', unit: '원' },
  { label: '사업자번호',      value: '', editable: true,  badge: 'required', badgeLabel: '확인필요', placeholder: '사업자번호 입력' },
  { label: '진단명',          value: '', editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '계약자·계좌정보', value: '', editable: true,  badge: 'linked',   badgeLabel: '연동',     placeholder: '계좌정보 입력' },
])

const autoCount = computed(() => draftFields.value.filter(f => !f.editable && f.value).length)
const requiredCount = computed(() => draftFields.value.filter(f => f.editable && !f.value).length)

const goToDraft = () => {
  ocrItems.value.forEach((item) => {
    const idx = ocrKeyToDraftIndex[item.key]
    if (idx !== undefined) draftFields.value[idx].value = item.value
  })
  draftFields.value.forEach((field) => {
    if (!field.editable && !field.value) {
      field.editable = true
      field.badge = 'required'
      field.badgeLabel = '확인필요'
      field.placeholder = `${field.label} 입력`
    }
  })
  step.value = 3
}

// 청구 서류 체크리스트
const docChecklist = [
  { name: '진료 영수증', sub: '이미 확보됨',             checked: true },
  { name: '진단서',      sub: '병원에서 발급받아야 해요', checked: false },
  { name: '신분증 사본', sub: '본인 확인용',              checked: false },
  { name: '통장 사본',   sub: '보험금 입금용',            checked: false },
]
</script>

<template>
  <!-- Step 1: 보험금 청구 서류 작성 -->
  <div
    v-if="step === 1"
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]"
  >
    <button
      type="button"
      class="mb-(--space-4) text-(color:--color-navy)"
      aria-label="뒤로가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="24" />
    </button>

    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        보험금 청구 서류 작성
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) leading-relaxed">
        진료 영수증을 업로드하면 AI가 항목을 자동으로 인식해<br />
        서류 초안을 만들어드려요
      </p>
    </header>

    <section class="bg-(--color-gray-100) rounded-(--radius-xl) p-(--space-5)">
      <p class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-2)">진료 영수증 업로드</p>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) leading-relaxed mb-(--space-4)">
        AI가 항목을 자동으로 인식해 서류 초안을 만들어드려요
      </p>

      <label
        for="receipt-input"
        class="flex items-center justify-center w-full py-(--space-4) bg-(--color-white) border-2 border-dashed border-(--color-gray-300) rounded-(--radius-lg) cursor-pointer"
      >
        <input
          id="receipt-input"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleFileSelect"
        />
        <span class="text-(length:--font-base) font-medium text-(color:--color-gray-500)">
          {{ receiptFileName || '+ 영수증 이미지 첨부' }}
        </span>
      </label>
    </section>
  </div>

  <!-- Step 2: 보험금 청구 서류 확인 -->
  <div
    v-else-if="step === 2"
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]"
  >
    <button
      type="button"
      class="mb-(--space-4) text-(color:--color-navy)"
      aria-label="뒤로가기"
      @click="step = 1"
    >
      <IconArrowLeft :size="24" />
    </button>

    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        보험금 청구 서류 확인
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        AI가 인식한 항목을 확인해주세요
      </p>
    </header>

    <OcrResultCard :file-name="receiptFileName" :items="ocrItems" />

    <AppButton block @click="goToDraft">서류 초안 생성하기</AppButton>
  </div>

  <!-- Step 3: 보험금 청구 서류 초안 -->
  <div
    v-else
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]"
  >
    <button
      type="button"
      class="mb-(--space-4) text-(color:--color-navy)"
      aria-label="뒤로가기"
      @click="step = 2"
    >
      <IconArrowLeft :size="24" />
    </button>

    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        보험금 청구 서류 초안
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) leading-relaxed">
        영수증 정보로 자동 작성했어요 · 부족한 항목만 채워주세요
      </p>
    </header>

    <!-- 요약 통계 -->
    <div class="grid grid-cols-2 gap-(--space-3) mb-(--space-5)">
      <div class="bg-(--color-olive-surface) rounded-(--radius-lg) p-(--space-4) flex flex-col gap-(--space-1)">
        <span class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">{{ autoCount }}건</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-600)">자동 완성</span>
      </div>
      <div class="bg-(--color-gold-surface) rounded-(--radius-lg) p-(--space-4) flex flex-col gap-(--space-1)">
        <span class="text-(length:--font-2xl) font-bold text-(color:--color-gold-dark)">{{ requiredCount }}건</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-600)">직접 확인 필요</span>
      </div>
    </div>

    <ClaimDraftCard :fields="draftFields" />

    <ClaimChecklist :items="docChecklist" />

    <AppButton block variant="primary" class="mt-(--space-5)" @click="router.push('/home')">
      홈으로 돌아가기
    </AppButton>
  </div>
</template>
