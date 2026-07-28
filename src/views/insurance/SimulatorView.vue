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

const verdictColorClasses = {
  FAVORABLE: 'text-(color:--color-gold-light)',
  NEUTRAL: 'text-(color:--color-gray-300)',
  UNFAVORABLE: 'text-(color:--color-danger)',
}

async function handleSimulate() {
  if (!selectedPet.value) {
    errorMessage.value = '반려동물을 선택해주세요.'
    return
  }

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
  let parsed
  try {
    parsed = new URL(url, window.location.origin)
  } catch {
    return
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return
  window.open(parsed.href, '_blank', 'noopener,noreferrer')
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
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-[calc(100vh-var(--header-height)-var(--bottom-nav-height))]"
  >
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        펫보험 손익분기 시뮬레이터
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-(--space-2)">
        가입이 유리한지 미리 계산해보세요
      </p>
    </header>

    <div
      v-if="pets.length === 0"
      class="text-center text-(color:--color-gray-600) bg-(--color-white) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-sm)"
    >
      <p>등록된 반려동물이 없어요.</p>
      <router-link
        to="/pets/register"
        class="inline-block mt-(--space-3) text-(color:--color-navy) font-semibold"
      >
        반려동물 등록하러 가기
      </router-link>
    </div>

    <template v-else>
      <form
        v-if="!result"
        class="flex flex-col gap-(--space-5)"
        @submit.prevent="handleSimulate"
      >
        <div v-if="pets.length > 1">
          <label
            id="pet-select-label"
            class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)"
          >
            반려동물 선택
          </label>
          <div
            class="flex flex-wrap gap-(--space-2)"
            role="group"
            aria-labelledby="pet-select-label"
          >
            <button
              v-for="pet in pets"
              :key="pet.id"
              type="button"
              class="inline-flex items-center gap-(--space-1) py-(--space-2) px-(--space-3) border rounded-(--radius-full) text-(length:--font-sm)"
              :class="
                pet.id === selectedPetId
                  ? 'border-(--color-navy) bg-(--color-navy) text-(color:--color-white)'
                  : 'border-(--color-gray-300) bg-(--color-white) text-(color:--color-gray-700)'
              "
              :aria-pressed="pet.id === selectedPetId"
              @click="selectedPetId = pet.id"
            >
              <component
                :is="pet.species === 'CAT' ? IconCat : IconDog"
                :size="16"
                :color="pet.id === selectedPetId ? 'var(--color-white)' : 'var(--color-navy)'"
              />
              {{ pet.name }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)">
            견종
          </label>
          <div class="py-(--space-3) px-(--space-4) bg-(--color-gray-100) rounded-(--radius-md) text-(length:--font-base) text-(color:--color-gray-800)">
            {{ selectedPet?.breed }}
          </div>
        </div>

        <div>
          <label class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)">
            나이
          </label>
          <div class="py-(--space-3) px-(--space-4) bg-(--color-gray-100) rounded-(--radius-md) text-(length:--font-base) text-(color:--color-gray-800)">
            {{ selectedPet?.age }}세
          </div>
        </div>

        <div>
          <label
            id="medical-label"
            class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)"
          >
            병력
          </label>

          <div
            v-if="medicalTags.length"
            class="flex flex-wrap gap-(--space-2) mb-(--space-3)"
          >
            <span
              v-for="tag in medicalTags"
              :key="tag.id"
              class="inline-flex items-center gap-(--space-2) py-(--space-1) px-(--space-3) bg-(--color-gray-100) rounded-(--radius-full) text-(length:--font-sm) text-(color:--color-gray-800)"
            >
              {{ tag.label }}
              <button
                type="button"
                class="text-(color:--color-gray-500) text-(length:--font-md) leading-none"
                :aria-label="`${tag.label} 삭제`"
                @click="removeMedicalTag(tag.id)"
              >
                ×
              </button>
            </span>
          </div>

          <div class="flex gap-(--space-2)">
            <button
              type="button"
              class="flex-1 min-w-0 flex items-center justify-between gap-(--space-2) py-(--space-3) px-(--space-4) border border-(--color-gray-300) rounded-(--radius-md) text-(length:--font-base) bg-(--color-white) text-(color:--color-gray-800)"
              aria-haspopup="dialog"
              :aria-expanded="isMedicalSheetOpen"
              aria-labelledby="medical-label"
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
              aria-label="기타 병력 직접 입력"
              class="flex-1 min-w-0 py-(--space-3) px-(--space-4) border border-(--color-gray-300) rounded-(--radius-md) text-(length:--font-base)"
            >
            <button
              type="button"
              class="flex-none px-(--space-4) bg-(--color-navy) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-sm) font-semibold"
              @click="addMedicalTag"
            >
              + 추가
            </button>
          </div>

          <p
            v-if="tagFeedback"
            class="mt-(--space-2) text-(color:--color-danger) text-(length:--font-sm)"
          >
            {{ tagFeedback }}
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="text-(color:--color-danger) text-(length:--font-sm)"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="w-full py-(--space-3) px-(--space-4) bg-(--color-gold) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-base) font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          {{ isLoading ? '계산 중...' : '결과 계산하기' }}
        </button>
      </form>

      <section
        v-else
        class="flex flex-col gap-(--space-5)"
      >
        <div class="bg-(--color-navy) text-(color:--color-white) rounded-(--radius-lg) p-(--space-5)">
          <span
            class="inline-block py-(--space-1) px-(--space-3) rounded-(--radius-full) text-(length:--font-xs) font-semibold bg-white/15"
            :class="verdictColorClasses[result.insuranceAdvice.verdict]"
          >
            {{ verdictLabels[result.insuranceAdvice.verdict] }}
          </span>
          <p class="text-(length:--font-lg) font-bold mt-(--space-3)">
            {{ result.insuranceAdvice.message }}
          </p>

          <div class="flex justify-between mt-(--space-5) pt-(--space-4) border-t border-white/15">
            <div class="flex flex-col gap-(--space-1)">
              <span class="text-(length:--font-xs) opacity-70">예상 연 의료비</span>
              <span class="text-(length:--font-lg) font-bold text-(color:--color-gold-light)">
                {{ result.expectedAnnualMedicalCost.toLocaleString() }}원
              </span>
            </div>
            <div class="flex flex-col gap-(--space-1) text-right">
              <span class="text-(length:--font-xs) opacity-70">연 보험료</span>
              <span class="text-(length:--font-lg) font-bold">
                {{ result.annualPremium.toLocaleString() }}원
              </span>
            </div>
          </div>

          <p class="mt-(--space-4) text-(length:--font-xs) opacity-70">
            {{ result.breakEvenNote }}
          </p>
        </div>

        <button
          class="w-full py-(--space-3) px-(--space-4) border border-(--color-gray-300) rounded-(--radius-md) text-(length:--font-md) text-(color:--color-gray-600)"
          @click="handleReset"
        >
          다시 계산하기
        </button>

        <div>
          <h2 class="text-(length:--font-lg) font-semibold text-(color:--color-navy)">
            추천 보험
          </h2>
          <p class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-1) mb-(--space-4)">
            이 프로필에 맞는 상품이에요
          </p>

          <ul class="flex flex-col gap-(--space-4)">
            <li
              v-for="product in result.recommendedProducts"
              :key="product.productId"
              class="bg-(--color-white) border border-(--color-gray-200) rounded-(--radius-lg) p-(--space-4) shadow-(--shadow-sm)"
            >
              <span class="inline-block py-(--space-1) px-(--space-2) bg-(--color-gray-100) text-(color:--color-gray-600) rounded-(--radius-sm) text-(length:--font-xs) font-medium">
                {{ product.badge }}
              </span>
              <p class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2)">
                {{ product.companyName }}
              </p>
              <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mt-(--space-1)">
                {{ product.productName }}
              </p>
              <p class="text-(length:--font-md) font-bold text-(color:--color-navy) mt-(--space-2)">
                월 {{ product.premium.toLocaleString() }}원 · 가입연령 {{ product.joinAgeRange }}
              </p>
              <ul class="mt-(--space-3) flex flex-col gap-(--space-1)">
                <li
                  v-for="coverage in product.coverages"
                  :key="coverage"
                  class="text-(length:--font-sm) text-(color:--color-gray-600)"
                >
                  {{ coverage }}
                </li>
              </ul>
              <button
                type="button"
                class="w-full mt-(--space-4) py-(--space-3) px-(--space-4) bg-(--color-navy) text-(color:--color-white) rounded-(--radius-md) text-(length:--font-base) font-semibold"
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
