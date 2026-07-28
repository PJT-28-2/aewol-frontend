<script setup>
import { ref, computed } from 'vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import BottomSheet from '@/components/common/BottomSheet.vue'

// TODO(backend): 보험 시뮬레이터용 반려동물 프로필 조회 GET API가 아직 없어 목업으로 대체.
// usePetStore는 이 화면에서 쓰지 않음 — 전용 API가 나오면 아래 목업을 그 호출로 교체.
const pets = ref([
  { id: 1, name: '포메', species: 'DOG', breed: '포메라니안', age: 3 },
])

const selectedPetId = ref(pets.value.length === 1 ? pets.value[0].id : null)
const selectedPet = computed(
  () => pets.value.find((pet) => pet.id === selectedPetId.value) || null,
)

const medicalOptions = [
  { code: 'DENTAL', label: '치과·구강질환' },
  { code: 'URINARY', label: '비뇨기질환' },
  { code: 'FOREIGN_BODY', label: '이물섭취/이물제거' },
  { code: 'JOINT', label: '슬개골·관절질환' },
  { code: 'SKIN', label: '피부질환' },
  { code: 'DIGESTIVE', label: '소화기질환' },
  { code: 'NONE', label: '병력 없음' },
  { code: 'OTHER', label: '기타' },
]

const pendingCode = ref(medicalOptions[0].code)
const pendingOtherText = ref('')
const medicalTags = ref([])
const tagFeedback = ref('')
let nextTagId = 0

const isMedicalSheetOpen = ref(false)
const pendingLabel = computed(
  () => medicalOptions.find((opt) => opt.code === pendingCode.value)?.label ?? '',
)

function selectPendingCode(code) {
  pendingCode.value = code
  isMedicalSheetOpen.value = false
}

function addMedicalTag() {
  tagFeedback.value = ''

  const isOther = pendingCode.value === 'OTHER'
  const label = isOther
    ? pendingOtherText.value.trim()
    : medicalOptions.find((opt) => opt.code === pendingCode.value)?.label

  if (isOther && !label) {
    tagFeedback.value = '병력 내용을 입력해주세요.'
    return
  }

  const isDuplicate = medicalTags.value.some((tag) =>
    isOther ? tag.code === 'OTHER' && tag.label === label : tag.code === pendingCode.value,
  )
  if (isDuplicate) {
    tagFeedback.value = '이미 추가된 병력이에요.'
    return
  }

  if (pendingCode.value === 'NONE') {
    medicalTags.value = []
  } else {
    medicalTags.value = medicalTags.value.filter((tag) => tag.code !== 'NONE')
  }

  medicalTags.value.push({ id: nextTagId++, code: pendingCode.value, label })
  pendingOtherText.value = ''
}

function removeMedicalTag(id) {
  medicalTags.value = medicalTags.value.filter((tag) => tag.id !== id)
}

const result = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const verdictLabels = {
  FAVORABLE: '가입 유리',
  NEUTRAL: '중립',
  UNFAVORABLE: '가입 불리',
}

async function handleSimulate() {
  if (!selectedPet.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // TODO(backend): POST /insurance/simulate 완성되면 mockSimulate 대신 insuranceApi.simulate(payload) 결과를 사용
    result.value = await mockSimulate()
  } catch {
    errorMessage.value = '시뮬레이션에 실패했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

function handleReset() {
  result.value = null
  medicalTags.value = []
}

function openProduct(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// TODO(backend): recommendedProducts의 badge/joinAgeRange/coverages/productUrl은
// 요약 응답 스키마 확정 시 백엔드와 재확인 필요 (지금은 화면 검증용 목업 값)
function mockSimulate() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        expectedAnnualMedicalCost: 820000,
        annualPremium: 312000,
        breakEvenNote: '손익분기 지점: 자기부담금 포함 약 45만원 초과 시부터 이득',
        insuranceAdvice: {
          verdict: 'FAVORABLE',
          message: '가입하는 것이 유리해요',
        },
        recommendedProducts: [
          {
            productId: 1,
            companyName: '현대해상',
            productName:
              '(무)현대해상다이렉트꼼꼼우리펫보험(재가입용)(HI2605) 2종<반려묘>_표준플랜',
            premium: 28650,
            badge: '온라인가입',
            joinAgeRange: '1~19세',
            coverages: [
              '반려묘입원의료비 15백만원',
              '반려묘의료비확장보장(MRI/CT) 100만원',
            ],
            productUrl: 'https://example.com/products/1',
          },
          {
            productId: 2,
            companyName: '농협손보',
            productName: '(무)NH다이렉트펫앤미든든보험[2종<고양이>](2604)',
            premium: 29336,
            badge: '모바일가입',
            joinAgeRange: '2~20세',
            coverages: ['반려묘입원의료비 10백만원'],
            productUrl: 'https://example.com/products/2',
          },
        ],
      })
    }, 600)
  })
}
</script>

<template>
  <div class="simulator-page">
    <header class="page-header">
      <h1>펫보험 손익분기 시뮬레이터</h1>
      <p class="page-description">
        가입이 유리한지 미리 계산해보세요
      </p>
    </header>

    <div
      v-if="pets.length === 0"
      class="empty-state card"
    >
      <p>등록된 반려동물이 없어요.</p>
      <router-link
        to="/pets/register"
        class="btn-link"
      >
        반려동물 등록하러 가기
      </router-link>
    </div>

    <template v-else>
      <form
        v-if="!result"
        class="simulator-form"
        @submit.prevent="handleSimulate"
      >
        <div
          v-if="pets.length > 1"
          class="form-group"
        >
          <label>반려동물 선택</label>
          <div class="pet-select-list">
            <button
              v-for="pet in pets"
              :key="pet.id"
              type="button"
              class="pet-chip"
              :class="{ 'pet-chip--active': pet.id === selectedPetId }"
              @click="selectedPetId = pet.id"
            >
              <component
                :is="pet.species === 'CAT' ? IconCat : IconDog"
                :size="16"
              />
              {{ pet.name }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>견종</label>
          <div class="readonly-field">
            {{ selectedPet?.breed }}
          </div>
        </div>

        <div class="form-group">
          <label>나이</label>
          <div class="readonly-field">
            {{ selectedPet?.age }}세
          </div>
        </div>

        <div class="form-group">
          <label>병력</label>

          <div
            v-if="medicalTags.length"
            class="tag-list"
          >
            <span
              v-for="tag in medicalTags"
              :key="tag.id"
              class="tag-chip"
            >
              {{ tag.label }}
              <button
                type="button"
                class="tag-remove"
                aria-label="병력 삭제"
                @click="removeMedicalTag(tag.id)"
              >
                ×
              </button>
            </span>
          </div>

          <div class="tag-input-row">
            <button
              type="button"
              class="tag-select-trigger"
              @click="isMedicalSheetOpen = true"
            >
              <span>{{ pendingLabel }}</span>
              <IconChevronDown
                size="16"
                color="var(--color-gray-500)"
              />
            </button>
            <input
              v-if="pendingCode === 'OTHER'"
              v-model="pendingOtherText"
              type="text"
              placeholder="병력을 입력해주세요"
              class="tag-other-input"
            >
            <button
              type="button"
              class="btn-add-tag"
              @click="addMedicalTag"
            >
              + 추가
            </button>
          </div>

          <p
            v-if="tagFeedback"
            class="tag-feedback"
          >
            {{ tagFeedback }}
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="error-text"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="btn-primary"
          :disabled="isLoading"
        >
          {{ isLoading ? '계산 중...' : '결과 계산하기' }}
        </button>
      </form>

      <section
        v-else
        class="result-section"
      >
        <div class="advice-card">
          <span
            class="advice-verdict"
            :class="`advice-verdict--${result.insuranceAdvice.verdict.toLowerCase()}`"
          >
            {{ verdictLabels[result.insuranceAdvice.verdict] }}
          </span>
          <p class="advice-message">
            {{ result.insuranceAdvice.message }}
          </p>

          <div class="advice-figures">
            <div class="advice-figure">
              <span class="advice-figure-label">예상 연 의료비</span>
              <span class="advice-figure-value advice-figure-value--highlight">
                {{ result.expectedAnnualMedicalCost.toLocaleString() }}원
              </span>
            </div>
            <div class="advice-figure">
              <span class="advice-figure-label">연 보험료</span>
              <span class="advice-figure-value">
                {{ result.annualPremium.toLocaleString() }}원
              </span>
            </div>
          </div>

          <p class="advice-note">
            {{ result.breakEvenNote }}
          </p>
        </div>

        <button
          class="btn-outline"
          @click="handleReset"
        >
          다시 계산하기
        </button>

        <div class="product-section">
          <h2 class="product-section-title">
            추천 보험
          </h2>
          <p class="product-section-desc">
            이 프로필에 맞는 상품이에요
          </p>

          <ul class="product-list">
            <li
              v-for="product in result.recommendedProducts"
              :key="product.productId"
              class="product-card"
            >
              <span class="product-badge">{{ product.badge }}</span>
              <p class="product-company">
                {{ product.companyName }}
              </p>
              <p class="product-name">
                {{ product.productName }}
              </p>
              <p class="product-premium">
                월 {{ product.premium.toLocaleString() }}원 · 가입연령 {{ product.joinAgeRange }}
              </p>
              <ul class="product-coverage-list">
                <li
                  v-for="coverage in product.coverages"
                  :key="coverage"
                >
                  {{ coverage }}
                </li>
              </ul>
              <button
                type="button"
                class="btn-view-product"
                @click="openProduct(product.productUrl)"
              >
                상품 보러가기
              </button>
            </li>
          </ul>
        </div>
      </section>

      <BottomSheet
        v-model="isMedicalSheetOpen"
        title="병력 선택"
      >
        <ul>
          <li
            v-for="opt in medicalOptions"
            :key="opt.code"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
              :class="
                opt.code === pendingCode
                  ? 'text-(color:--color-gold) font-bold'
                  : 'text-(color:--color-slate-dark)'
              "
              @click="selectPendingCode(opt.code)"
            >
              <span>{{ opt.label }}</span>
              <IconCheck
                v-if="opt.code === pendingCode"
                size="18"
                color="var(--color-gold)"
              />
            </button>
          </li>
        </ul>
      </BottomSheet>
    </template>
  </div>
</template>

<style scoped>
.simulator-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--header-height) - var(--bottom-nav-height));
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.page-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-2);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  text-align: center;
  color: var(--color-gray-600);
}

.btn-link {
  display: inline-block;
  margin-top: var(--space-3);
  color: var(--color-navy);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.simulator-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group > label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.readonly-field {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  color: var(--color-gray-800);
}

.pet-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pet-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-full);
  background-color: var(--color-white);
  color: var(--color-gray-700);
  font-size: var(--font-sm);
  cursor: pointer;
}

.pet-chip--active {
  border-color: var(--color-navy);
  background-color: var(--color-navy);
  color: var(--color-white);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-gray-100);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  color: var(--color-gray-800);
}

.tag-remove {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-gray-500);
  font-size: var(--font-md);
  line-height: 1;
  cursor: pointer;
}

.tag-input-row {
  display: flex;
  gap: var(--space-2);
}

.tag-select-trigger,
.tag-other-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
}

.tag-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  background-color: var(--color-white);
  color: var(--color-gray-800);
  cursor: pointer;
}

.btn-add-tag {
  flex: 0 0 auto;
  padding: 0 var(--space-4);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-sm);
}

.tag-feedback {
  margin-top: var(--space-2);
  color: var(--color-danger);
  font-size: var(--font-sm);
}

.btn-primary {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-gold);
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

.result-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.advice-card {
  background-color: var(--color-navy);
  color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.advice-verdict {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  background-color: rgba(255, 255, 255, 0.15);
}

.advice-verdict--favorable {
  color: var(--color-gold-light);
}

.advice-verdict--neutral {
  color: var(--color-gray-300);
}

.advice-verdict--unfavorable {
  color: var(--color-danger);
}

.advice-message {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  margin-top: var(--space-3);
}

.advice-figures {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.advice-figure {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.advice-figure:last-child {
  text-align: right;
}

.advice-figure-label {
  font-size: var(--font-xs);
  opacity: 0.7;
}

.advice-figure-value {
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
}

.advice-figure-value--highlight {
  color: var(--color-gold-light);
}

.advice-note {
  margin-top: var(--space-4);
  font-size: var(--font-xs);
  opacity: 0.7;
}

.btn-outline {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-gray-600);
  cursor: pointer;
}

.product-section-title {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
}

.product-section-desc {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
  margin-bottom: var(--space-4);
}

.product-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.product-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.product-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: var(--font-medium);
}

.product-company {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-2);
}

.product-name {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-top: var(--space-1);
}

.product-premium {
  font-size: var(--font-md);
  font-weight: var(--font-bold);
  color: var(--color-navy);
  margin-top: var(--space-2);
}

.product-coverage-list {
  list-style: none;
  padding: 0;
  margin: var(--space-3) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.product-coverage-list li {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
}

.btn-view-product {
  width: 100%;
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
}
</style>
