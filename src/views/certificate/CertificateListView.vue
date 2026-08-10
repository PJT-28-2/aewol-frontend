<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificateStore } from '@/stores/certificate'
import { useMemberStore } from '@/stores/member'
import { formatBirthDateInput, formatDateDot } from '@/utils/date'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconRegistrationPaper from '@/components/common/icons/IconRegistrationPaper.vue'
import IconSyringe from '@/components/common/icons/IconSyringe.vue'
import IconStethoscope from '@/components/common/icons/IconStethoscope.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'

const router = useRouter()
const certificateStore = useCertificateStore()
const memberStore = useMemberStore()

onMounted(async () => {
  await certificateStore.fetchPets()
  if (certificateStore.selectedPetId) {
    await certificateStore.fetchCertificates(certificateStore.selectedPetId)
  }
})

function goToRegistrationDetail() {
  if (!certificateStore.registrationDoc) return
  router.push(`/certificates/${certificateStore.selectedPetId}/${certificateStore.registrationDoc.docId}`)
}

// 접종증명서/진료확인서도 동물등록증 "보기"와 같은 상세 페이지로 이동
function goToDocDetail(doc) {
  router.push(`/certificates/${doc.petId}/${doc.docId}`)
}

// 동물등록증 연동 — 동물등록번호 + 신청인(보호자) 이름/생년월일로 조회.
// 흐름: 정보 입력(회원정보로 기본값) → 조회 → 조회된 동물 중 연동할 항목 선택 → 저장
const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/
const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/

const showAuthModal = ref(false)
const showMatchModal = ref(false)

const authForm = ref({ regNumber: '', userName: '', birthDate: '' })
const authError = ref('')
const isSubmittingAuth = ref(false)

const candidates = ref([])
const selectedCandidatePetIds = ref([])
const isConfirming = ref(false)
const matchError = ref('')

async function openLinkFlow() {
  authForm.value = {
    regNumber: certificateStore.selectedPet?.regNumber ?? '',
    userName: '',
    birthDate: '',
  }
  authError.value = ''

  // 회원정보(이름, 생년월일)를 기본값으로 채운다. 모두 이후 직접 수정 가능
  try {
    if (!memberStore.profile) await memberStore.fetchProfile()
    authForm.value.userName = memberStore.profile?.name ?? ''
    authForm.value.birthDate = memberStore.profile?.birthDate
      ? formatDateDot(memberStore.profile.birthDate)
      : ''
  } catch {
    // 회원정보 조회 실패 시에도 조회 자체는 계속 진행할 수 있도록 빈 값으로 둔다
  }

  showAuthModal.value = true
}

function handleBirthDateInput(value) {
  authForm.value.birthDate = formatBirthDateInput(value)
}

async function submitAuth() {
  if (!REG_NUMBER_PATTERN.test(authForm.value.regNumber)) {
    authError.value = '동물등록번호를 12자리 또는 15자리 숫자로 입력해주세요.'
    return
  }
  const hasBirthDate = BIRTH_DATE_PATTERN.test(authForm.value.birthDate)
  if (authForm.value.birthDate && !hasBirthDate) {
    authError.value = '생년월일을 1990.01.01 형식으로 입력해주세요.'
    return
  }
  if (!authForm.value.userName.trim() && !hasBirthDate) {
    authError.value = '이름 또는 생년월일 중 하나 이상 입력해주세요.'
    return
  }

  authError.value = ''
  isSubmittingAuth.value = true
  try {
    candidates.value = await certificateStore.requestApmsSimpleAuth(authForm.value)
    selectedCandidatePetIds.value = candidates.value.map((c) => c.petId)
    showAuthModal.value = false
    showMatchModal.value = true
  } catch {
    authError.value = '조회에 실패했어요. 다시 시도해주세요.'
  } finally {
    isSubmittingAuth.value = false
  }
}

function toggleCandidate(petId) {
  const idx = selectedCandidatePetIds.value.indexOf(petId)
  if (idx === -1) {
    selectedCandidatePetIds.value.push(petId)
  } else {
    selectedCandidatePetIds.value.splice(idx, 1)
  }
}

async function confirmMatches() {
  const selected = candidates.value.filter((c) => selectedCandidatePetIds.value.includes(c.petId))
  if (selected.length === 0) return

  matchError.value = ''
  isConfirming.value = true
  try {
    await certificateStore.confirmApmsLink(selected)
    showMatchModal.value = false
  } catch {
    matchError.value = '연동에 실패했어요. 다시 시도해주세요.'
  } finally {
    isConfirming.value = false
  }
}

// 접종증명서 업로드
const vaccinationInputRef = ref(null)
function openVaccinationUpload() {
  vaccinationInputRef.value?.click()
}
async function handleVaccinationSelect(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file || !certificateStore.selectedPetId) return
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있어요.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하여야 해요.')
    return
  }
  try {
    await certificateStore.uploadVaccination(certificateStore.selectedPetId, file)
  } catch (error) {
    const serverMessage = error.response?.data?.message
    const fallbackMessages = {
      400: '파일 또는 발급일을 확인해주세요.',
      403: '접종증명서를 업로드할 권한이 없어요.',
      404: '반려동물 정보를 찾을 수 없어요.',
    }
    alert(
      serverMessage ||
        fallbackMessages[error.response?.status] ||
        '업로드에 실패했어요. 다시 시도해주세요.',
    )
  }
}

// 진료확인서 업로드
const medicalInputRef = ref(null)
function openMedicalUpload() {
  medicalInputRef.value?.click()
}
async function handleMedicalSelect(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file || !certificateStore.selectedPetId) return
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있어요.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하여야 해요.')
    return
  }
  try {
    await certificateStore.uploadMedicalConfirmation(certificateStore.selectedPetId, file)
  } catch {
    alert('업로드에 실패했어요. 다시 시도해주세요.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-7))]">
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        증명서 관리
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        동물등록증・접종증명서를 한곳에서 확인해요
      </p>
    </header>

    <!-- 반려동물 탭 -->
    <div
      class="mb-(--space-6) flex items-center gap-(--space-2) overflow-x-auto whitespace-nowrap pb-(--space-1) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="반려동물 선택"
    >
      <PetSelectorChip
        v-for="pet in certificateStore.pets"
        :key="pet.petId"
        :label="pet.name"
        :species="pet.species"
        :selected="certificateStore.selectedPetId === pet.petId"
        role="tab"
        :aria-selected="certificateStore.selectedPetId === pet.petId"
        @click="certificateStore.selectPet(pet.petId)"
      />
    </div>

    <LoadingSpinner
      v-if="certificateStore.isLoading"
      class="my-(--space-8)"
    />

    <template v-else>
      <!-- 동물등록증 -->
      <section class="mb-(--space-6)">
        <h2 class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-3)">
          동물등록증
        </h2>

        <div
          v-if="certificateStore.registrationDoc"
          class="flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) p-(--space-4)"
        >
          <FeatureIconTile
            :icon="IconRegistrationPaper"
            tone="pink"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-(--space-2) mb-(--space-1)">
              <p class="text-(length:--font-md) font-bold text-(color:--color-navy) truncate">
                {{ certificateStore.registrationDoc.docName }}
              </p>
              <span class="shrink-0 text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive)">
                APMS 연동됨
              </span>
            </div>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500)">
              등록번호: {{ certificateStore.selectedPet?.regNumber }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 p-(--space-2) text-(color:--color-gray-400)"
            aria-label="상세보기"
            @click="goToRegistrationDetail"
          >
            <IconChevronRight
              :size="18"
              color="currentColor"
            />
          </button>
        </div>

        <template v-else>
          <EmptyState
            :icon="IconRegistrationPaper"
            message="아직 연동된 동물등록증이 없어요"
          />
          <AppButton
            variant="neutral"
            block
            class="border-(--color-leaf)! bg-(--color-white)!"
            @click="openLinkFlow"
          >
            <IconPlus
              size="18"
              color="var(--color-leaf-dark)"
            />
            동물등록증 연동하기
          </AppButton>
        </template>
      </section>

      <!-- 접종증명서 -->
      <section class="mb-(--space-6)">
        <h2 class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-3)">
          접종증명서
        </h2>

        <ul
          v-if="certificateStore.vaccinationDocs.length > 0"
          class="mb-(--space-3)"
        >
          <li
            v-for="doc in certificateStore.vaccinationDocs"
            :key="doc.docId"
            class="flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) p-(--space-4) mb-(--space-2)"
          >
            <FeatureIconTile
              :icon="IconSyringe"
              tone="blue"
            />
            <div class="flex-1 min-w-0">
              <p class="text-(length:--font-md) font-semibold text-(color:--color-navy) truncate">
                {{ doc.docName }}
              </p>
              <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-(--space-1)">
                {{ doc.issuedDate ? `${formatDateDot(doc.issuedDate)} 발급` : '발급일 미입력' }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 p-(--space-2) text-(color:--color-gray-400)"
              aria-label="상세보기"
              @click="goToDocDetail(doc)"
            >
              <IconChevronRight
                :size="18"
                color="currentColor"
              />
            </button>
          </li>
        </ul>
        <EmptyState
          v-else
          :icon="IconSyringe"
          message="아직 등록된 접종증명서가 없어요"
        />

        <input
          ref="vaccinationInputRef"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleVaccinationSelect"
        >
        <AppButton
          variant="neutral"
          block
          class="border-(--color-leaf)! bg-(--color-white)!"
          @click="openVaccinationUpload"
        >
          <IconPlus
            size="18"
            color="var(--color-leaf-dark)"
          />
          접종증명서 업로드
        </AppButton>
      </section>

      <!-- 진료확인서 -->
      <section>
        <h2 class="text-(length:--font-base) font-bold text-(color:--color-navy) mb-(--space-3)">
          진료확인서
        </h2>

        <ul
          v-if="certificateStore.medicalDocs.length > 0"
          class="mb-(--space-3)"
        >
          <li
            v-for="doc in certificateStore.medicalDocs"
            :key="doc.docId"
            class="flex items-center gap-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) p-(--space-4) mb-(--space-2)"
          >
            <FeatureIconTile
              :icon="IconStethoscope"
              tone="green"
            />
            <div class="flex-1 min-w-0">
              <p class="text-(length:--font-md) font-semibold text-(color:--color-navy) truncate">
                {{ doc.docName }}
              </p>
              <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-(--space-1)">
                {{ formatDateDot(doc.issuedDate) }} 업로드
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 p-(--space-2) text-(color:--color-gray-400)"
              aria-label="상세보기"
              @click="goToDocDetail(doc)"
            >
              <IconChevronRight
                :size="18"
                color="currentColor"
              />
            </button>
          </li>
        </ul>
        <EmptyState
          v-else
          :icon="IconStethoscope"
          message="아직 등록된 진료확인서가 없어요"
        />

        <input
          ref="medicalInputRef"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleMedicalSelect"
        >
        <AppButton
          variant="neutral"
          block
          class="border-(--color-leaf)! bg-(--color-white)!"
          @click="openMedicalUpload"
        >
          <IconPlus
            size="18"
            color="var(--color-leaf-dark)"
          />
          진료확인서 업로드
        </AppButton>
      </section>
    </template>

    <!-- 1단계: 조회를 위한 신원확인 입력 -->
    <AppModal
      v-model="showAuthModal"
      title="동물등록증 조회"
    >
      <template #icon>
        <IconRegistrationPaper size="24" />
      </template>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-(--space-4)">
        국가동물보호정보시스템 조회를 위해 신청인 정보를 입력해주세요
      </p>
      <div class="flex flex-col gap-(--space-3)">
        <AppInput
          v-model="authForm.regNumber"
          label="동물등록번호"
          placeholder="12자리 또는 15자리 숫자 입력"
          inputmode="numeric"
          maxlength="15"
        />
        <AppInput
          v-model="authForm.userName"
          label="이름"
          placeholder="홍길동"
        />
        <AppInput
          :model-value="authForm.birthDate"
          label="생년월일"
          placeholder="1990.01.01"
          inputmode="numeric"
          @update:model-value="handleBirthDateInput"
        />
      </div>
      <p
        v-if="authError"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-2)"
      >
        {{ authError }}
      </p>
      <template #footer>
        <div class="flex w-full gap-(--space-3)">
          <AppButton
            variant="neutral"
            size="lg"
            class="flex-1"
            @click="showAuthModal = false"
          >
            취소
          </AppButton>
          <AppButton
            variant="primary"
            size="lg"
            class="flex-1"
            :loading="isSubmittingAuth"
            @click="submitAuth"
          >
            조회하기
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- 2단계: 조회된 동물 중 연동할 항목 선택 -->
    <AppModal
      v-model="showMatchModal"
      title="조회된 동물등록정보"
      :show-close="false"
    >
      <template #icon>
        <IconRegistrationPaper size="24" />
      </template>
      <template v-if="candidates.length > 0">
        <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-(--space-3)">
          신청인 명의로 조회된 동물이에요. 연동할 항목을 선택해주세요
        </p>
        <ul class="flex flex-col gap-(--space-2)">
          <li
            v-for="candidate in candidates"
            :key="candidate.petId"
          >
            <label
              class="flex cursor-pointer items-center gap-(--space-3) rounded-(--radius-xl) border p-(--space-4) transition-colors"
              :class="selectedCandidatePetIds.includes(candidate.petId)
                ? 'border-(--color-leaf) bg-(--color-leaf-soft)'
                : 'border-(--color-card-border) bg-(--color-white)'"
            >
              <input
                type="checkbox"
                :checked="selectedCandidatePetIds.includes(candidate.petId)"
                class="size-5 shrink-0 accent-(--color-leaf)"
                @change="toggleCandidate(candidate.petId)"
              >
              <div class="flex-1 min-w-0">
                <p class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
                  {{ candidate.name }} · {{ candidate.breed }}
                </p>
                <p class="text-(length:--font-xs) text-(color:--color-gray-500) mt-(--space-1)">
                  등록번호: {{ candidate.regNumber }}
                </p>
              </div>
            </label>
          </li>
        </ul>
      </template>
      <p
        v-else
        class="text-(length:--font-sm) text-(color:--color-gray-600)"
      >
        신청인 명의로 새로 조회된 동물이 없어요. 이미 모두 연동되어 있을 수 있어요.
      </p>
      <p
        v-if="matchError"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-2)"
      >
        {{ matchError }}
      </p>
      <template #footer>
        <div class="flex w-full gap-(--space-3)">
          <AppButton
            variant="neutral"
            size="lg"
            class="flex-1"
            @click="showMatchModal = false"
          >
            닫기
          </AppButton>
          <AppButton
            v-if="candidates.length > 0"
            variant="primary"
            size="lg"
            class="flex-1"
            :loading="isConfirming"
            :disabled="selectedCandidatePetIds.length === 0"
            @click="confirmMatches"
          >
            연동하기
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
