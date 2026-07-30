<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificateStore } from '@/stores/certificate'
import { formatDateDot } from '@/utils/date'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconCertificate from '@/components/common/icons/IconCertificate.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
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
  router.push(`/certificates/${certificateStore.registrationDoc.docId}`)
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
  await certificateStore.uploadVaccination(certificateStore.selectedPetId, file)
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
  await certificateStore.uploadMedicalConfirmation(certificateStore.selectedPetId, file)
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
          class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4)"
        >
          <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-white)">
            <IconCertificate :size="20" />
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
          <AppButton
            size="sm"
            variant="secondary"
            class="shrink-0"
            @click="goToRegistrationDetail"
          >
            보기
          </AppButton>
        </div>

        <EmptyState
          v-else
          :icon="IconCertificate"
          message="아직 연동된 동물등록증이 없어요"
        />
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
            class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-2)"
          >
            <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-white)">
              <IconDocument
                :size="18"
                color="var(--color-slate-dark)"
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
            <IconChevronRight
              :size="18"
              color="var(--color-gray-400)"
              class="shrink-0"
            />
          </li>
        </ul>
        <EmptyState
          v-else
          :icon="IconDocument"
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
            class="flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-2)"
          >
            <span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-(--radius-md) bg-(--color-white)">
              <IconDocument
                :size="18"
                color="var(--color-slate-dark)"
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
            <IconChevronRight
              :size="18"
              color="var(--color-gray-400)"
              class="shrink-0"
            />
          </li>
        </ul>
        <EmptyState
          v-else
          :icon="IconDocument"
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
  </div>
</template>
