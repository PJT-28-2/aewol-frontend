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

// 동물등록증 연동 — 상단 탭에서 이미 선택된 반려동물(selectedPetId)을 대상으로 동물등록번호 +
// 신청인(보호자) 이름/생년월일을 검증. verify() 호출 자체가 검증+저장을 한 번에 처리하므로
// 별도 "조회 결과에서 선택" 단계가 없다 — 흐름: 정보 입력(회원정보로 기본값) → 바로 연동
const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/
const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/

const showAuthModal = ref(false)

const authForm = ref({ regNumber: '', userName: '', birthDate: '' })
const authError = ref('')
const isSubmittingAuth = ref(false)

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
    await certificateStore.verifyRegistration(certificateStore.selectedPetId, authForm.value)
    showAuthModal.value = false
  } catch (err) {
    authError.value = err.response?.data?.message ?? '동물등록증 연동에 실패했어요. 다시 시도해주세요.'
  } finally {
    isSubmittingAuth.value = false
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

    <!-- 동물등록증 연동을 위한 신원확인 입력 — 제출하면 검증과 동시에 바로 연동(저장)됨 -->
    <AppModal
      v-model="showAuthModal"
      title="동물등록증 연동"
    >
      <template #icon>
        <IconRegistrationPaper size="24" />
      </template>
      <p class="text-(length:--font-sm) text-(color:--color-gray-600) mb-(--space-4)">
        국가동물보호정보시스템에서 확인 후 바로 연동할게요. 신청인 정보를 입력해주세요
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
            연동하기
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
