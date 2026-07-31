<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificateStore } from '@/stores/certificate'
import { formatDateDot } from '@/utils/date'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconRegistrationPaper from '@/components/common/icons/IconRegistrationPaper.vue'
import IconSyringe from '@/components/common/icons/IconSyringe.vue'
import IconStethoscope from '@/components/common/icons/IconStethoscope.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'

const router = useRouter()
const certificateStore = useCertificateStore()

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

// 동물등록증 연동 — 신원확인 1회로 신청인 명의의 동물이 (여러 마리면 배열로) 조회됨.
// 흐름: 신원확인 입력 → 조회 → 조회된 동물 중 연동할 항목 선택 → 저장
const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/
const PHONE_PATTERN = /^01[0-9]-?\d{3,4}-?\d{4}$/

const showAuthModal = ref(false)
const showMatchModal = ref(false)

const authForm = ref({ userName: '', birthDate: '', phoneNo: '' })
const authError = ref('')
const isSubmittingAuth = ref(false)

const candidates = ref([])
const selectedCandidatePetIds = ref([])
const isConfirming = ref(false)
const matchError = ref('')

function openLinkFlow() {
  authForm.value = { userName: '', birthDate: '', phoneNo: '' }
  authError.value = ''
  showAuthModal.value = true
}

async function submitAuth() {
  if (!authForm.value.userName.trim()) {
    authError.value = '이름을 입력해주세요.'
    return
  }
  if (!BIRTH_DATE_PATTERN.test(authForm.value.birthDate)) {
    authError.value = '생년월일을 1990.01.01 형식으로 입력해주세요.'
    return
  }
  if (!PHONE_PATTERN.test(authForm.value.phoneNo)) {
    authError.value = '전화번호를 010-1234-5678 형식으로 입력해주세요.'
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
  } catch {
    alert('업로드에 실패했어요. 다시 시도해주세요.')
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
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]">
    <button
      type="button"
      class="mb-(--space-4) text-(color:--color-navy)"
      aria-label="뒤로가기"
      @click="router.back()"
    >
      <IconArrowLeft :size="24" />
    </button>

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
      class="mb-(--space-6) flex items-center gap-(--space-2)"
      role="tablist"
      aria-label="반려동물 선택"
    >
      <button
        v-for="pet in certificateStore.pets"
        :key="pet.petId"
        type="button"
        role="tab"
        :aria-selected="certificateStore.selectedPetId === pet.petId"
        class="inline-flex h-(--control-height-sm) items-center gap-(--space-1) px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-bold transition-opacity hover:opacity-80"
        :class="
          certificateStore.selectedPetId === pet.petId
            ? 'border-(--color-navy) bg-(--color-navy) text-(color:--color-white)'
            : 'border-(--color-border) bg-(--color-surface) text-(color:--color-slate-dark)'
        "
        @click="certificateStore.selectPet(pet.petId)"
      >
        <component
          :is="pet.species === 'CAT' ? IconCat : IconDog"
          :size="16"
          :color="certificateStore.selectedPetId === pet.petId ? 'var(--color-white)' : 'var(--color-slate-dark)'"
        />
        {{ pet.name }}
      </button>
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
          <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-pastel-blue)">
            <IconRegistrationPaper
              :size="20"
              color="var(--color-navy)"
            />
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-(--space-2) mb-(--space-1)">
              <p class="text-(length:--font-md) font-bold text-(color:--color-navy) truncate">
                {{ certificateStore.registrationDoc.docName }}
              </p>
              <span class="shrink-0 text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)">
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
            variant="secondary"
            block
            @click="openLinkFlow"
          >
            + 동물등록증 연동하기
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
            <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-pastel-green)">
              <IconSyringe
                :size="18"
                color="var(--color-navy)"
              />
            </span>
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
          variant="secondary"
          block
          @click="openVaccinationUpload"
        >
          + 접종증명서 업로드
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
            <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-pastel-lilac)">
              <IconStethoscope
                :size="18"
                color="var(--color-navy)"
              />
            </span>
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
          variant="secondary"
          block
          @click="openMedicalUpload"
        >
          + 진료확인서 업로드
        </AppButton>
      </section>
    </template>

    <!-- 1단계: 조회를 위한 신원확인 입력 -->
    <AppModal
      v-model="showAuthModal"
      title="동물등록증 조회"
    >
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-(--space-4)">
        국가동물보호정보시스템 조회를 위해 신청인 정보를 입력해주세요
      </p>
      <div class="flex flex-col gap-(--space-3)">
        <AppInput
          v-model="authForm.userName"
          label="이름"
          placeholder="홍길동"
        />
        <AppInput
          v-model="authForm.birthDate"
          label="생년월일"
          placeholder="1990.01.01"
          inputmode="numeric"
        />
        <AppInput
          v-model="authForm.phoneNo"
          label="전화번호"
          placeholder="010-1234-5678"
          inputmode="tel"
        />
      </div>
      <p
        v-if="authError"
        class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-2)"
      >
        {{ authError }}
      </p>
      <template #footer>
        <AppButton
          variant="secondary"
          @click="showAuthModal = false"
        >
          취소
        </AppButton>
        <AppButton
          :loading="isSubmittingAuth"
          @click="submitAuth"
        >
          조회하기
        </AppButton>
      </template>
    </AppModal>

    <!-- 2단계: 조회된 동물 중 연동할 항목 선택 -->
    <AppModal
      v-model="showMatchModal"
      title="조회된 동물등록정보"
      :show-close="false"
    >
      <template v-if="candidates.length > 0">
        <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-(--space-3)">
          신청인 명의로 조회된 동물이에요. 연동할 항목을 선택해주세요
        </p>
        <ul class="flex flex-col gap-(--space-2)">
          <li
            v-for="candidate in candidates"
            :key="candidate.petId"
          >
            <label class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-3) cursor-pointer">
              <input
                type="checkbox"
                :checked="selectedCandidatePetIds.includes(candidate.petId)"
                class="shrink-0 w-5 h-5 accent-(--color-navy)"
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
        class="text-(length:--font-xs) text-(color:--color-danger) mt-(--space-2)"
      >
        {{ matchError }}
      </p>
      <template #footer>
        <AppButton
          variant="secondary"
          @click="showMatchModal = false"
        >
          닫기
        </AppButton>
        <AppButton
          v-if="candidates.length > 0"
          :loading="isConfirming"
          :disabled="selectedCandidatePetIds.length === 0"
          @click="confirmMatches"
        >
          선택한 동물 연동하기
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
