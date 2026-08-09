<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import AppButton from '@/components/common/AppButton.vue'
import iconCat3d from '@/assets/images/icons-3d/cat_face_3d.png'
import iconDog3d from '@/assets/images/icons-3d/dog_face_3d.png'
import EmptyState from '@/components/common/EmptyState.vue'
import MedicalHistoryPicker from '@/components/insurance/MedicalHistoryPicker.vue'
import { usePetStore } from '@/stores/pet'
import { useInsuranceStore } from '@/stores/insurance'
import { calcAgeFromBirthDate } from '@/utils/date'

const petStore = usePetStore()
const insuranceStore = useInsuranceStore()
const { pets } = storeToRefs(petStore)

onMounted(async () => {
  try {
    await petStore.fetchPets()
    if (pets.value.length === 1) selectedPetId.value = pets.value[0].id
  } catch {
    petLoadError.value = '반려동물 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  }
})

const selectedPetId = ref(null)
const selectedPet = computed(
  () => pets.value.find((pet) => pet.id === selectedPetId.value) || null,
)

const medicalTags = ref([])

function petIcon(species) {
  return species === 'CAT' ? iconCat3d : iconDog3d
}

const result = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const petLoadError = ref('')

const verdictLabels = {
  FAVORABLE: '가입 유리',
  NEUTRAL: '중립',
  UNFAVORABLE: '가입 불리',
}

const verdictColorClasses = {
  FAVORABLE: 'text-(color:--color-gold-light)',
  NEUTRAL: 'text-(color:--color-gray-300)',
  UNFAVORABLE: 'text-(color:--color-danger-strong)',
}

async function handleSimulate() {
  if (!selectedPet.value) {
    errorMessage.value = '반려동물을 선택해주세요.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    result.value = await insuranceStore.simulate({
      petId: selectedPet.value.id,
      species: selectedPet.value.species,
      breed: selectedPet.value.breed,
      age: calcAgeFromBirthDate(selectedPet.value.birthDate),
      medicalHistoryCodes: medicalTags.value.length > 0
        ? medicalTags.value.map((tag) => tag.code)
        : ['NONE'],
    })
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
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >

    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        손익분기 시뮬레이터
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
        가입이 유리한지 미리 계산해보세요
      </p>
    </header>

    <p
      v-if="petLoadError"
      class="text-(color:--color-danger-strong) text-(length:--font-sm)"
    >
      {{ petLoadError }}
    </p>
    <EmptyState
      v-else-if="pets.length === 0"
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
        <div class="flex flex-col gap-(--space-5) rounded-(--radius-xl) bg-(--color-white) p-(--space-5) shadow-(--shadow-md)">
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
                    : 'border-(--color-border) bg-(--color-surface) text-(color:--color-gray-700)'
                "
                :aria-pressed="pet.id === selectedPetId"
                @click="selectedPetId = pet.id"
              >
                <img
                  :src="petIcon(pet.species)"
                  alt=""
                  class="w-[18px] h-[18px] object-contain saturate-[0.8] brightness-[1.03] contrast-[0.95]"
                >
                {{ pet.name }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)">
              견종
            </label>
            <input
              class="h-(--control-height-md) w-full cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none"
              type="text"
              :value="selectedPet?.breed"
              readonly
            >
          </div>

          <div>
            <label class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)">
              나이
            </label>
            <input
              class="h-(--control-height-md) w-full cursor-default rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none"
              type="text"
              :value="selectedPet ? `${calcAgeFromBirthDate(selectedPet.birthDate)}세` : ''"
              readonly
            >
          </div>

          <MedicalHistoryPicker v-model="medicalTags" />
        </div>

        <p
          v-if="errorMessage"
          class="text-(color:--color-danger-strong) text-(length:--font-sm)"
        >
          {{ errorMessage }}
        </p>

        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          block
          :loading="isLoading"
        >
          결과 계산하기
        </AppButton>
      </form>

      <section
        v-else
        class="flex flex-col gap-(--space-5)"
      >
        <div class="bg-(--color-navy) text-(color:--color-white) rounded-(--radius-xl) p-(--space-5) shadow-(--shadow-md)">
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
                {{ result.assumptions.annualExpectedVetCostKrw.toLocaleString() }}원
              </span>
            </div>
            <div class="flex flex-col gap-(--space-1) text-right">
              <span class="text-(length:--font-xs) opacity-70">연 예상 진료 횟수</span>
              <span class="text-(length:--font-lg) font-bold">
                {{ result.assumptions.annualClaimCount }}회
              </span>
            </div>
          </div>

          <p
            v-if="result.preExistingConditionWarning"
            class="mt-(--space-4) text-(length:--font-xs) opacity-70"
          >
            {{ result.preExistingConditionWarning }}
          </p>
        </div>

        <AppButton
          type="button"
          variant="secondary"
          size="lg"
          block
          class="border-(--color-border)!"
          @click="handleReset"
        >
          다시 계산하기
        </AppButton>

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
              class="bg-(--color-white) rounded-(--radius-lg) p-(--space-4) shadow-(--shadow-md)"
            >
              <p class="text-(length:--font-sm) text-(color:--color-gray-500)">
                {{ product.companyName }}
              </p>
              <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mt-(--space-1)">
                {{ product.productName }}
              </p>
              <p class="text-(length:--font-md) font-bold text-(color:--color-navy) mt-(--space-2)">
                월 {{ product.monthlyPremiumKrw.toLocaleString() }}원 · 환급률 {{ product.reimbursementRatePct }}%
              </p>
              <p
                v-if="product.regulatoryCapWarning"
                class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-slate-muted)"
              >
                {{ product.regulatoryCapWarning }}
              </p>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
