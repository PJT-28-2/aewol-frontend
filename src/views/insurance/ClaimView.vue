<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { usePetStore } from '@/stores/pet'
import { useInsuranceStore } from '@/stores/insurance'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import { registerHeaderBack } from '@/composables/useHeaderBack'
import OcrResultCard from '@/components/insurance/OcrResultCard.vue'
import ClaimDraftCard from '@/components/insurance/ClaimDraftCard.vue'
import ClaimChecklist from '@/components/insurance/ClaimChecklist.vue'
import iconCat3d from '@/assets/images/icons-3d/cat_face_3d.png'
import iconDog3d from '@/assets/images/icons-3d/dog_face_3d.png'
import memoIcon3d from '@/assets/images/icons-3d/memo_3d.png'

const router = useRouter()
const route = useRoute()
const petStore = usePetStore()
const insuranceStore = useInsuranceStore()
const { pets } = storeToRefs(petStore)

const step = ref(1)

registerHeaderBack(() => {
  if (step.value > 1) {
    step.value -= 1
  } else {
    router.back()
  }
})

// 반려동물 선택
const selectedPetId = ref(null)
const petLoadError = ref('')

onMounted(async () => {
  try {
    await petStore.fetchPets()
    if (pets.value.length === 1) selectedPetId.value = pets.value[0].id
  } catch (e) {
    console.error('[ClaimView] 반려동물 로딩 실패', e)
    petLoadError.value = '반려동물 정보를 불러오지 못했어요.'
  }
})

function petIcon(species) {
  return species === 'CAT' ? iconCat3d : iconDog3d
}

// 영수증 업로드
const receiptFileName = ref('')
const isUploading = ref(false)
const uploadError = ref('')
const currentClaimId = ref(null)

// OCR 결과 (API 응답으로 채워짐)
const ocrItems = ref([])

function parseExtractedData(extracted) {
  let data = extracted ?? {}
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { data = {} }
  }
  return [
    { key: 'hospital', label: '병원명',    value: data.hospital_name ?? '',                           unit: '' },
    { key: 'date',     label: '진료일',    value: data.treatment_date ?? '',                          unit: '' },
    { key: 'treatment',label: '진료 항목', value: data.items?.map(i => i.name).filter(Boolean).join(', ') ?? '', unit: '' },
    { key: 'fee',      label: '진료비',    value: data.total_amount != null ? String(data.total_amount) : '', unit: '원' },
  ]
}

const handleFileSelect = async (event) => {
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
  if (!selectedPetId.value) {
    uploadError.value = '먼저 반려동물을 선택해주세요.'
    return
  }

  receiptFileName.value = file.name
  uploadError.value = ''
  isUploading.value = true

  try {
    const claim = await insuranceStore.submitClaim(selectedPetId.value, file)
    currentClaimId.value = claim.claimId
    ocrItems.value = parseExtractedData(claim.extractedData)
    step.value = 2
  } catch (e) {
    console.error('[ClaimView] 영수증 업로드 실패', e)
    uploadError.value = '영수증 업로드에 실패했어요. 다시 시도해주세요.'
    receiptFileName.value = ''
  } finally {
    isUploading.value = false
  }
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

// PDF 초안에서 뒤로 왔을 때 step 3 복원
if (route.query.step === '3' && insuranceStore.claimDraft) {
  const d = insuranceStore.claimDraft
  draftFields.value[0].value = d.hospitalName   || ''
  draftFields.value[1].value = d.visitDate      || ''
  draftFields.value[2].value = d.claimAmount    || ''
  draftFields.value[3].value = d.businessNumber || ''
  draftFields.value[4].value = d.diagnosis      || ''
  draftFields.value[5].value = d.accountInfo    || ''
  step.value = 3
}

const autoCount = computed(() => draftFields.value.filter(f => !f.editable && f.value).length)
const requiredCount = computed(() => draftFields.value.filter(f => f.editable && !f.value).length)

const goToDraft = () => {
  ocrItems.value.forEach((item) => {
    const idx = ocrKeyToDraftIndex[item.key]
    if (idx !== undefined) draftFields.value[idx].value = item.value?.trim() ?? ''
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

const showValidationModal = ref(false)
const missingLabels = ref([])

const goToPdfDraft = () => {
  const f = draftFields.value
  const requiredIndexes = [
    { idx: 0, label: '병원명' },
    { idx: 1, label: '진료일자' },
    { idx: 2, label: '청구금액' },
    { idx: 3, label: '사업자번호' },
    { idx: 4, label: '진단명' },
    { idx: 5, label: '계약자·계좌정보' },
  ]
  const missing = requiredIndexes
    .filter(({ idx }) => !f[idx].value?.trim())
    .map(({ label }) => label)

  if (missing.length > 0) {
    missingLabels.value = missing
    showValidationModal.value = true
    return
  }

  insuranceStore.setClaimDraft({
    claimId:        currentClaimId.value,
    hospitalName:   f[0].value,
    visitDate:      f[1].value,
    claimAmount:    f[2].value,
    businessNumber: f[3].value || '',
    diagnosis:      f[4].value,
    accountInfo:    f[5].value,
  })
  router.push('/insurance/claim/pdf-draft')
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
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        보험금 청구 서류 작성
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) leading-relaxed">
        진료 영수증을 업로드하면 AI가 항목을 자동으로 인식해<br />
        서류 초안을 만들어드려요
      </p>
    </header>

    <p v-if="petLoadError" class="text-(color:--color-danger-strong) text-(length:--font-sm) mb-(--space-4)">
      {{ petLoadError }}
    </p>

    <!-- 반려동물 선택 -->
    <section
      v-if="!petLoadError"
      class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) shadow-(--shadow-md) mb-(--space-4)"
    >
      <p class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-3)">반려동물 선택</p>
      <div v-if="pets.length > 0" class="flex gap-(--space-3) overflow-x-auto pb-(--space-1)">
        <button
          v-for="pet in pets"
          :key="pet.id"
          type="button"
          class="flex flex-col items-center gap-(--space-1) px-(--space-3) py-(--space-2) rounded-(--radius-lg) border-2 shrink-0 transition-colors"
          :class="selectedPetId === pet.id
            ? 'border-(--color-gold) bg-(--color-gold-surface)'
            : 'border-(--color-border) bg-(--color-surface)'"
          @click="selectedPetId = pet.id; uploadError = ''"
        >
          <img :src="petIcon(pet.species)" alt="" class="w-8 h-8 object-contain" />
          <span class="text-(length:--font-sm) font-medium text-(color:--color-navy)">{{ pet.name }}</span>
        </button>
      </div>
      <p v-else class="text-(length:--font-sm) text-(color:--color-slate-muted) text-center py-(--space-3)">
        등록된 반려동물이 없어요. 먼저 반려동물을 등록해주세요.
      </p>
    </section>

    <!-- 영수증 업로드 -->
    <section class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) shadow-(--shadow-md)">
      <p class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-2)">진료 영수증 업로드</p>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted) leading-relaxed mb-(--space-4)">
        AI가 항목을 자동으로 인식해 서류 초안을 만들어드려요
      </p>

      <p v-if="uploadError" class="text-(color:--color-danger-strong) text-(length:--font-sm) mb-(--space-3)">
        {{ uploadError }}
      </p>

      <label
        for="receipt-input"
        class="flex items-center justify-center w-full py-(--space-4) bg-(--color-surface) border-2 border-dashed border-(--color-gray-300) rounded-(--radius-lg)"
        :class="(isUploading || !!petLoadError || pets.length === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
      >
        <input
          id="receipt-input"
          type="file"
          accept="image/*"
          class="sr-only"
          :disabled="isUploading || !!petLoadError || pets.length === 0"
          @change="handleFileSelect"
        />
        <span class="text-(length:--font-base) font-medium text-(color:--color-gray-500)">
          {{ isUploading ? 'AI가 영수증을 분석하는 중...' : (receiptFileName || '+ 영수증 이미지 첨부') }}
        </span>
      </label>
    </section>
  </div>

  <!-- Step 2: 보험금 청구 서류 확인 -->
  <div
    v-else-if="step === 2"
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        보험금 청구 서류 확인
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted)">
        AI가 인식한 항목을 확인해주세요
      </p>
    </header>

    <OcrResultCard :file-name="receiptFileName" :items="ocrItems" />

    <AppButton block @click="goToDraft">서류 초안 생성하기</AppButton>
  </div>

  <!-- Step 3: 보험금 청구 서류 초안 -->
  <div
    v-else
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        보험금 청구 서류 초안
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) leading-relaxed">
        영수증 정보로 자동 작성했어요 · 부족한 항목만 채워주세요
      </p>
    </header>

    <!-- 요약 통계 -->
    <div class="grid grid-cols-2 gap-(--space-3) mb-(--space-5)">
      <div class="bg-(--color-white) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-md)">
        <p class="text-(length:--font-sm) text-(color:--color-slate-dark)">자동 완성</p>
        <p class="text-(length:--font-xl) font-bold text-(color:--color-olive) mt-(--space-2)">{{ autoCount }}건</p>
      </div>
      <div class="bg-(--color-white) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-md)">
        <p class="text-(length:--font-sm) text-(color:--color-slate-dark)">직접 확인 필요</p>
        <p class="text-(length:--font-xl) font-bold text-(color:--color-danger-strong) mt-(--space-2)">{{ requiredCount }}건</p>
      </div>
    </div>

    <ClaimDraftCard :fields="draftFields" @pdf-click="goToPdfDraft" />

    <ClaimChecklist :items="docChecklist" />

    <AppButton block variant="secondary" class="mt-(--space-5)" @click="router.push('/home')">
      홈으로 돌아가기
    </AppButton>
  </div>

  <!-- 필수값 누락 모달 -->
  <AppModal v-model="showValidationModal" title="입력이 필요한 항목이 있어요" :divider="false">
    <div class="flex flex-col items-center text-center">
      <img
        :src="memoIcon3d"
        alt=""
        class="w-16 h-16 object-contain mb-(--space-3)"
      >
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-4)">
        PDF 초안을 만들기 전에 아래 항목을 채워주세요.
      </p>
    </div>
    <ul class="flex flex-wrap justify-center gap-(--space-2)">
      <li
        v-for="label in missingLabels"
        :key="label"
        class="inline-flex items-center py-(--space-1) px-(--space-3) rounded-(--radius-full) bg-(--color-danger-soft) text-(length:--font-sm) font-medium text-(color:--color-danger-strong)"
      >
        {{ label }}
      </li>
    </ul>
    <template #footer>
      <AppButton
        variant="primary"
        size="lg"
        block
        class="!rounded-(--radius-lg)"
        @click="showValidationModal = false"
      >
        확인
      </AppButton>
    </template>
  </AppModal>
</template>
