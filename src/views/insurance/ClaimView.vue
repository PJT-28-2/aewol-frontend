<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'

const router = useRouter()

const step = ref(1) // 1: 서류 작성, 2: OCR 확인, 3: 초안

const receiptFile = ref(null)
const receiptFileName = ref('')

// OCR 추출 결과 (실제 연동 전 임시 데이터)
const ocrItems = ref([
  { key: 'date',      label: '진료일',    value: '2026.07.10' },
  { key: 'hospital',  label: '병원명',    value: '24시 제주동물의료센터' },
  { key: 'treatment', label: '진료 항목', value: '슬개골 탈구 치료' },
  { key: 'fee',       label: '진료비',    value: '168,000원' },
])
const editingKey = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  receiptFile.value = file
  receiptFileName.value = file.name
  step.value = 2
}

const startEdit = (key) => { editingKey.value = key }
const finishEdit = () => { editingKey.value = null }

// 청구서 초안 필드
const draftFields = ref([
  { label: '병원명',          value: '24시 제주동물의료센터', editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '진료일자',        value: '2026.07.10',            editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '청구금액',        value: '168,000원',             editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '사업자번호',      value: '',                      editable: true,  badge: 'required', badgeLabel: '확인필요', placeholder: '사업자번호 입력' },
  { label: '진단명',          value: '슬개골 탈구 치료',      editable: false, badge: 'auto',     badgeLabel: '자동',     placeholder: '' },
  { label: '계약자·계좌정보', value: '',                      editable: true,  badge: 'linked',   badgeLabel: '연동',     placeholder: '계좌정보 입력' },
])

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

    <!-- OCR 결과 카드 -->
    <section
      class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) mb-(--space-5) [box-shadow:var(--shadow-md)]"
    >
      <div class="mb-(--space-4)">
        <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
          {{ receiptFileName || '진료 영수증.jpg' }}
        </p>
        <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-2)">
          OCR 인식 완료 · Gemini Vision
        </p>
        <span class="inline-block text-(length:--font-xs) font-semibold px-(--space-3) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)">
          인식 완료
        </span>
      </div>

      <div class="h-px bg-(--color-border) mb-(--space-4)" />

      <div class="flex justify-between items-center mb-(--space-3)">
        <span class="text-(length:--font-sm) font-semibold text-(color:--color-gray-700)">추출된 항목</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-500)">탭해서 수정</span>
      </div>

      <ul>
        <li
          v-for="item in ocrItems"
          :key="item.key"
          class="flex items-center justify-between py-(--space-3) border-b border-(--color-border) last:border-0 gap-(--space-3) cursor-pointer"
          @click="startEdit(item.key)"
        >
          <span class="text-(length:--font-md) text-(color:--color-gray-600) shrink-0">{{ item.label }}</span>
          <input
            v-if="editingKey === item.key"
            v-model="item.value"
            class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right border-b border-(--color-navy) outline-none bg-transparent w-full"
            autofocus
            @blur="finishEdit"
            @keyup.enter="finishEdit"
          />
          <span v-else class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right">
            {{ item.value }}
          </span>
        </li>
      </ul>
    </section>

    <AppButton block @click="step = 3">서류 초안 생성하기</AppButton>
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
        <span class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">4건</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-600)">자동 완성</span>
      </div>
      <div class="bg-(--color-gold-surface) rounded-(--radius-lg) p-(--space-4) flex flex-col gap-(--space-1)">
        <span class="text-(length:--font-2xl) font-bold text-(color:--color-gold-dark)">2건</span>
        <span class="text-(length:--font-sm) text-(color:--color-gray-600)">직접 확인 필요</span>
      </div>
    </div>

    <!-- 청구서 초안 카드 -->
    <section
      class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) mb-(--space-5) [box-shadow:var(--shadow-md)]"
    >
      <div class="flex justify-between items-center mb-(--space-4)">
        <span class="text-(length:--font-base) font-semibold text-(color:--color-gray-900)">보험금 청구서 초안</span>
        <button type="button" class="text-(length:--font-sm) text-(color:--color-gray-500)">PDF 초안</button>
      </div>

      <ul>
        <li
          v-for="field in draftFields"
          :key="field.label"
          class="border-b border-(--color-border) last:border-0"
        >
          <!-- 직접 입력 가능한 필드 -->
          <div v-if="field.editable" class="py-(--space-3)">
            <div class="flex items-center justify-between mb-(--space-2)">
              <span class="text-(length:--font-sm) text-(color:--color-gray-600)">{{ field.label }}</span>
              <span
                class="text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full)"
                :class="{
                  'bg-(--color-gold-surface) text-(color:--color-gold-dark)': field.badge === 'required',
                  'bg-(--color-info-surface) text-(color:--color-navy)':      field.badge === 'linked',
                }"
              >
                {{ field.badgeLabel }}
              </span>
            </div>
            <AppInput
              v-model="field.value"
              :placeholder="field.placeholder"
            />
          </div>

          <!-- 자동 완성 필드 -->
          <div v-else class="flex items-center py-(--space-3) gap-(--space-2)">
            <span class="text-(length:--font-md) text-(color:--color-gray-600) flex-1">{{ field.label }}</span>
            <span class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right">{{ field.value }}</span>
            <span class="shrink-0 text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)">
              {{ field.badgeLabel }}
            </span>
          </div>
        </li>
      </ul>
    </section>

    <!-- 청구 서류 체크리스트 -->
    <section
      class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) [box-shadow:var(--shadow-md)]"
    >
      <h2 class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-4)">
        청구 서류 체크리스트
      </h2>
      <ul class="flex flex-col gap-(--space-4)">
        <li
          v-for="doc in docChecklist"
          :key="doc.name"
          class="flex items-center gap-(--space-3)"
        >
          <span
            class="w-6 h-6 rounded-(--radius-full) shrink-0 flex items-center justify-center border-2"
            :class="doc.checked
              ? 'bg-(--color-success) border-(--color-success)'
              : 'border-(--color-gray-300)'"
          >
            <IconCheck v-if="doc.checked" :size="14" color="var(--color-white)" />
          </span>
          <div class="flex flex-col gap-[2px]">
            <span class="text-(length:--font-md) font-medium text-(color:--color-gray-900)">{{ doc.name }}</span>
            <span class="text-(length:--font-sm) text-(color:--color-gray-500)">{{ doc.sub }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
