<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MedicalHistoryPicker from '@/components/insurance/MedicalHistoryPicker.vue'
import { mockSimulatorPets, mockSimulateResult } from '@/mocks/insurance'

const router = useRouter()

function goBack() {
  router.back()
}

const pets = ref(mockSimulatorPets.map((pet) => ({ ...pet })))

const selectedPetId = ref(pets.value.length === 1 ? pets.value[0].id : null)
const selectedPet = computed(
  () => pets.value.find((pet) => pet.id === selectedPetId.value) || null,
)

const medicalTags = ref([])

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

function mockSimulate() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockSimulateResult), 600)
  })
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-[calc(100vh-var(--header-height)-var(--bottom-nav-height))]"
  >
    <button
      type="button"
      class="mb-(--space-3) text-(color:--color-navy)"
      aria-label="뒤로 가기"
      @click="goBack"
    >
      <IconArrowLeft size="24" />
    </button>

    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        펫보험 손익분기 시뮬레이터
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-(--space-2)">
        가입이 유리한지 미리 계산해보세요
      </p>
    </header>

    <EmptyState
      v-if="pets.length === 0"
      :icon="IconPaw"
      message="등록된 반려동물이 없어요."
      action-text="반려동물 등록하러 가기"
      action-route="/pets/register"
    />

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

        <MedicalHistoryPicker v-model="medicalTags" />

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
    </template>
  </div>
</template>
