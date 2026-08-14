<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconPetInsurance from '@/components/common/icons/IconPetInsurance.vue'
import AppButton from '@/components/common/AppButton.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
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

onUnmounted(() => {
  if (medicalCostDebounceTimer) clearTimeout(medicalCostDebounceTimer)
})

const selectedPetId = ref(null)
const selectedPet = computed(
  () => pets.value.find((pet) => pet.id === selectedPetId.value) || null,
)

const medicalTags = ref([])

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

// 환급률 확인 배지. 상태값(enum)과 표시 문구를 분리해, 문구를 바꾸거나 다국어를
// 붙여도 스타일 매핑이 깨지지 않게 한다.
//
// 상태는 reimbursementRatePct 하나만 보고 파생한다 — rate가 null이면 confidence
// 값과 무관하게 UNKNOWN으로 고정해, 한 카드에 "배지=추정 + 본문=미확인"이
// 동시에 뜨는 상황을 막는다.
const reimbursementStatusLabels = {
  CONFIRMED: '확인',
  ESTIMATED: '추정',
  UNKNOWN: '미확인',
}

const reimbursementStatusClasses = {
  CONFIRMED: 'bg-(--color-leaf-surface) text-(color:--color-leaf-dark)',
  ESTIMATED: 'bg-(--color-gray-100) text-(color:--color-gray-700)',
  UNKNOWN: 'bg-(--color-danger-soft) text-(color:--color-danger-strong)',
}

function reimbursementStatus(product) {
  if (product.reimbursementRatePct == null) return 'UNKNOWN'
  return product.reimbursementConfidence === 'CONFIRMED_OWN_COVERAGE_NAME'
    ? 'CONFIRMED'
    : 'ESTIMATED'
}

function breakEvenRowClass(isFavorable) {
  return isFavorable ? verdictColorClasses.FAVORABLE : verdictColorClasses.UNFAVORABLE
}

// 예상 연 의료비 조정 슬라이더 범위. 백엔드 @Max(S8)가 확정되면 맞춰서 조정한다.
const MEDICAL_COST_MIN = 100_000
const MEDICAL_COST_MAX = 3_000_000
const MEDICAL_COST_STEP = 10_000

const medicalCostDraft = ref(MEDICAL_COST_MIN)
const isAdjustingCost = ref(false)
let medicalCostDebounceTimer = null

// 마지막으로 시작한 시뮬레이션 요청의 순번. 응답을 반영하기 전에 이 값과 대조해,
// 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. 슬라이더를 빠르게
// 여러 번 조정하면 요청이 겹칠 수 있고, '다시 계산하기'로 입력 화면에 돌아온
// 뒤에 응답이 도착하면 결과 화면이 저절로 다시 뜨는 문제가 있었다.
let latestRequestSeq = 0

function isStale(seq) {
  return seq !== latestRequestSeq
}

function simulationPayload(extra) {
  return {
    petId: selectedPet.value.id,
    medicalHistoryCodes: medicalTags.value.length > 0
      ? medicalTags.value.map((tag) => tag.code)
      : ['NONE'],
    ...extra,
  }
}

async function handleSimulate() {
  if (!selectedPet.value) {
    errorMessage.value = '반려동물을 선택해주세요.'
    return
  }

  const seq = ++latestRequestSeq
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await insuranceStore.simulate(simulationPayload())
    if (isStale(seq)) return
    result.value = response
    medicalCostDraft.value = clampMedicalCost(
      response.assumptions.annualExpectedVetCostKrw,
    )
  } catch {
    if (isStale(seq)) return
    errorMessage.value = '시뮬레이션에 실패했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    if (!isStale(seq)) isLoading.value = false
  }
}

function clampMedicalCost(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return MEDICAL_COST_MIN
  return Math.min(MEDICAL_COST_MAX, Math.max(MEDICAL_COST_MIN, value))
}

// 드래그 중(input)에는 숫자 표시만 갱신한다. 예상보장금 계산은 서버 한 곳에서만
// 하므로, 여기서 프리뷰 값을 계산하지 않는다.
function onMedicalCostInput(event) {
  medicalCostDraft.value = Number(event.target.value)
}

// 슬라이더를 놓는 순간(change)에만 500ms 디바운스 후 서버를 재호출한다.
function onMedicalCostChange(event) {
  const value = Number(event.target.value)
  medicalCostDraft.value = value

  if (medicalCostDebounceTimer) clearTimeout(medicalCostDebounceTimer)
  medicalCostDebounceTimer = setTimeout(() => {
    commitMedicalCostAdjustment(value)
  }, 500)
}

async function commitMedicalCostAdjustment(value) {
  if (!selectedPet.value) return

  const seq = ++latestRequestSeq
  isAdjustingCost.value = true
  errorMessage.value = ''

  try {
    const response = await insuranceStore.simulate(
      simulationPayload({ annualMedicalCostKrw: value }),
    )
    if (isStale(seq)) return
    result.value = response
    medicalCostDraft.value = clampMedicalCost(
      response.assumptions.annualExpectedVetCostKrw ?? value,
    )
  } catch {
    if (isStale(seq)) return
    // 재계산에 실패하면 result는 이전 값 그대로다. 슬라이더 숫자만 새 값으로
    // 남겨두면 "예상 연 의료비 200만원"인데 아래 표는 51만원 기준으로 계산된
    // 화면이 되므로, 화면에 실제로 반영된 값으로 되돌린다.
    medicalCostDraft.value = clampMedicalCost(
      result.value?.assumptions?.annualExpectedVetCostKrw,
    )
    errorMessage.value = '의료비 조정 재계산에 실패했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    if (!isStale(seq)) isAdjustingCost.value = false
  }
}

// 입력 화면으로 돌아간다. 아직 실행되지 않은 디바운스 타이머를 반드시 제거해야
// 한다 — 슬라이더를 조정하고 500ms 안에 이 버튼을 누르면, 남아 있던 타이머가
// 뒤늦게 서버를 호출해 결과 화면이 저절로 다시 뜬다.
// 이미 날아간 요청은 취소할 수 없으므로 순번을 올려 그 응답을 무효화하고,
// 그 응답이 finally에서 끄지 못하게 된 로딩 플래그는 여기서 직접 내린다.
function handleReset() {
  if (medicalCostDebounceTimer) {
    clearTimeout(medicalCostDebounceTimer)
    medicalCostDebounceTimer = null
  }
  latestRequestSeq += 1
  isLoading.value = false
  isAdjustingCost.value = false
  errorMessage.value = ''
  result.value = null
  medicalTags.value = []
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-app-bg) min-h-screen"
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
              <PetSelectorChip
                v-for="pet in pets"
                :key="pet.id"
                :label="pet.name"
                :species="pet.species"
                :selected="pet.id === selectedPetId"
                @click="selectedPetId = pet.id"
              />
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

          <div class="flex flex-col gap-(--space-1) mt-(--space-5) pt-(--space-4) border-t border-white/15">
            <span class="text-(length:--font-xs) opacity-70">예상 연 의료비</span>
            <span class="text-(length:--font-lg) font-bold text-(color:--color-gold-light)">
              {{ result.assumptions.annualExpectedVetCostKrw.toLocaleString() }}원
            </span>
          </div>

          <p
            v-if="result.assumptions.assumptionSource"
            class="mt-(--space-3) text-(length:--font-xs) opacity-70"
          >
            <!--
              assumptionSource는 사용자가 의료비를 직접 조정하면 통계 출처 대신
              "사용자가 직접 입력한 값"으로 내려온다. 여기에 "· 직접 조정한 값이에요"를
              덧붙이면 같은 말이 두 번 나오므로 붙이지 않는다.
            -->
            가정 근거: {{ result.assumptions.assumptionSource }}
          </p>

          <p
            v-if="result.preExistingConditionWarning"
            class="mt-(--space-4) text-(length:--font-xs) opacity-70"
          >
            {{ result.preExistingConditionWarning }}
          </p>
        </div>

        <div class="flex flex-col gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4) shadow-(--shadow-md)">
          <div class="flex items-center justify-between gap-(--space-2)">
            <label
              for="medical-cost-range"
              class="text-(length:--font-sm) font-medium text-(color:--color-gray-700)"
            >
              예상 연 의료비 조정
            </label>
            <LoadingSpinner
              v-if="isAdjustingCost"
              size="sm"
            />
          </div>
          <input
            id="medical-cost-range"
            type="range"
            :min="MEDICAL_COST_MIN"
            :max="MEDICAL_COST_MAX"
            :step="MEDICAL_COST_STEP"
            :value="medicalCostDraft"
            class="w-full accent-(--color-leaf)"
            :aria-valuetext="`${medicalCostDraft.toLocaleString()}원`"
            @input="onMedicalCostInput"
            @change="onMedicalCostChange"
          >
          <div class="flex justify-between items-center text-(length:--font-xs) text-(color:--color-slate-muted)">
            <span>{{ MEDICAL_COST_MIN.toLocaleString() }}원</span>
            <span class="text-(length:--font-md) font-bold text-(color:--color-navy)">
              {{ medicalCostDraft.toLocaleString() }}원
            </span>
            <span>{{ MEDICAL_COST_MAX.toLocaleString() }}원</span>
          </div>
        </div>

        <p
          v-if="errorMessage"
          class="text-(color:--color-danger-strong) text-(length:--font-sm)"
        >
          {{ errorMessage }}
        </p>

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
          <p class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-1)">
            이 프로필에 맞는 상품이에요
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1) mb-(--space-4)">
            갱신 시 보험료 상승은 반영되지 않았어요.
          </p>

          <EmptyState
            v-if="result.recommendedProducts.length === 0"
            :icon="IconPetInsurance"
            message="조건에 맞는 추천 상품이 아직 없어요. 나중에 다시 확인해주세요."
          />

          <ul
            v-else
            class="flex flex-col gap-(--space-4)"
          >
            <li
              v-for="product in result.recommendedProducts"
              :key="product.productId"
              class="bg-(--color-white) rounded-(--radius-lg) p-(--space-4) shadow-(--shadow-md)"
            >
              <div class="flex items-start justify-between gap-(--space-2)">
                <div class="min-w-0">
                  <p class="text-(length:--font-sm) text-(color:--color-gray-500)">
                    {{ product.companyName }}
                  </p>
                  <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mt-(--space-1)">
                    {{ product.productName }}
                  </p>
                </div>
                <span
                  class="shrink-0 inline-block py-(--space-1) px-(--space-2) rounded-(--radius-full) text-(length:--font-xs) font-semibold"
                  :class="reimbursementStatusClasses[reimbursementStatus(product)]"
                >
                  {{ reimbursementStatusLabels[reimbursementStatus(product)] }}
                </span>
              </div>

              <p class="text-(length:--font-md) font-bold text-(color:--color-navy) mt-(--space-2)">
                월 {{ product.monthlyPremiumKrw.toLocaleString() }}원 ·
                {{ product.reimbursementRatePct != null
                  ? `환급률 ${product.reimbursementRatePct}%`
                  : '보장비율 미확인' }}
              </p>

              <!--
                담보별 환급률이 다른 상품(예: 통원 50% / 입원 70%)에서 위 환급률은
                대표값 하나일 뿐이다. 손익분기 계산 가능 여부와 무관하게 항상 함께
                보여줘야, 계산된 상품이 전 담보 50%인 것처럼 오해되지 않는다.
              -->
              <p
                v-if="product.reimbursementRateNote"
                class="mt-(--space-1) text-(length:--font-xs) text-(color:--color-slate-muted)"
              >
                {{ product.reimbursementRateNote }}
              </p>

              <p
                v-if="product.annualLimitKrw != null"
                class="mt-(--space-1) text-(length:--font-xs) text-(color:--color-slate-muted)"
              >
                연간 보장한도 {{ product.annualLimitKrw.toLocaleString() }}원
              </p>

              <p
                v-if="!product.deductibleApplied"
                class="mt-(--space-1) text-(length:--font-xs) text-(color:--color-slate-muted)"
              >
                자기부담금 미반영
              </p>

              <p
                v-if="product.regulatoryCapWarning"
                class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-slate-muted)"
              >
                {{ product.regulatoryCapWarning }}
              </p>

              <div
                v-if="product.breakEvenAvailable"
                class="mt-(--space-3) overflow-x-auto"
              >
                <table class="w-full min-w-[420px] text-(length:--font-xs) text-left border-collapse">
                  <thead>
                    <tr class="text-(color:--color-gray-500) border-b border-(--color-border)">
                      <th class="py-(--space-2) pr-(--space-2) font-medium">
                        기간
                      </th>
                      <th class="py-(--space-2) pr-(--space-2) font-medium">
                        누적보험료
                      </th>
                      <th class="py-(--space-2) pr-(--space-2) font-medium">
                        예상보장금
                      </th>
                      <th class="py-(--space-2) pr-(--space-2) font-medium">
                        차액
                      </th>
                      <th class="py-(--space-2) font-medium">
                        유불리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="scenario in product.breakEvenScenarios"
                      :key="scenario.years"
                      class="border-b border-(--color-border) last:border-0"
                    >
                      <td class="py-(--space-2) pr-(--space-2) text-(color:--color-gray-800)">
                        {{ scenario.years }}년
                      </td>
                      <td class="py-(--space-2) pr-(--space-2) text-(color:--color-gray-800)">
                        {{ scenario.cumulativePremiumKrw.toLocaleString() }}원
                      </td>
                      <td class="py-(--space-2) pr-(--space-2) text-(color:--color-gray-800)">
                        {{ scenario.expectedReimbursementKrw.toLocaleString() }}원
                      </td>
                      <td
                        class="py-(--space-2) pr-(--space-2)"
                        :class="breakEvenRowClass(scenario.isFavorable)"
                      >
                        {{ scenario.differenceKrw >= 0 ? '+' : '' }}{{ scenario.differenceKrw.toLocaleString() }}원
                      </td>
                      <td
                        class="py-(--space-2)"
                        :class="breakEvenRowClass(scenario.isFavorable)"
                      >
                        {{ scenario.isFavorable ? '유리' : '불리' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                v-else
                class="mt-(--space-3) rounded-(--radius-md) bg-(--color-gray-100) p-(--space-3)"
              >
                <p class="text-(length:--font-sm) font-medium text-(color:--color-gray-700)">
                  보장비율 미확인
                </p>
                <p class="mt-(--space-1) text-(length:--font-xs) text-(color:--color-slate-muted)">
                  약관에서 환급률을 확인하지 못해 손익분기를 계산하지 않았어요.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
