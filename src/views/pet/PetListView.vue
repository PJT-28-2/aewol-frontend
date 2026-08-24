<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconPetFace from '@/components/common/icons/IconPetFace.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
import IconEmergencyCross from '@/components/common/icons/IconEmergencyCross.vue'
import IconFamilyCare from '@/components/common/icons/IconFamilyCare.vue'
import IconPetInsurance from '@/components/common/icons/IconPetInsurance.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import dogHero from '@/assets/images/pet-dog-default-home-v3.webp'
import catHero from '@/assets/images/pet-cat-default-home-v3.webp'
import { usePetStore } from '@/stores/pet'

const petStore = usePetStore()
const { pets } = storeToRefs(petStore)
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const activePetId = ref(null)
const showRegistrationNotice = ref(route.query.registration === 'unverified')
const unverifiedPetId = ref(route.query.petId)
const primaryPet = computed(() =>
  pets.value.find((pet) => pet.id === activePetId.value) ?? pets.value[0] ?? null,
)
const orderedPets = computed(() => {
  const representativeId = petStore.representativePetId
  if (representativeId == null) return pets.value
  return [...pets.value].sort((a, b) => {
    if (a.id === representativeId) return -1
    if (b.id === representativeId) return 1
    return 0
  })
})
const isRepresentativePet = computed(() =>
  primaryPet.value?.id === (petStore.representativePetId ?? pets.value[0]?.id),
)

const lifeMenus = [
  { label: '함께 돌보기', to: '/share', icon: IconFamilyCare, tone: 'green' },
  { label: '증명서', to: '/certificates', icon: IconDocument, tone: 'pink' },
  { label: '응급 SOS', to: '/emergency', icon: IconEmergencyCross, tone: 'blue' },
  { label: '보험', to: '/insurance', icon: IconPetInsurance, tone: 'purple' },
]

function dismissRegistrationNotice() {
  showRegistrationNotice.value = false
  router.replace({ path: route.path })
}

function getAge(birthDate) {
  if (!birthDate) return 0
  const [year, month, day] = birthDate.split('-').map(Number)
  const birth = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1
  return age
}

function petHero(pet) {
  return pet.characterImg || pet.profileImg || (pet.species === 'CAT' ? catHero : dogHero)
}

function setRepresentativePet() {
  if (primaryPet.value) petStore.setRepresentativePet(primaryPet.value.id)
}

function selectPet(petId) {
  activePetId.value = petId
  if (petId) sessionStorage.setItem('lastViewedPetId', petId)
  else sessionStorage.removeItem('lastViewedPetId')
}

onMounted(async () => {
  try {
    await petStore.fetchPets()
    const lastViewedId = sessionStorage.getItem('lastViewedPetId')
    const lastViewedExists = pets.value.some((pet) => pet.id === lastViewedId)
    activePetId.value = (lastViewedExists ? lastViewedId : null)
      ?? petStore.representativePetId
      ?? pets.value[0]?.id
      ?? null
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) pt-(--space-3) pb-(--space-8)">
    <header class="mb-(--space-5) flex h-[42px] items-center">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        반려생활
      </h1>
    </header>

    <div
      v-if="showRegistrationNotice"
      class="mb-(--space-4) rounded-[20px] bg-(--color-leaf-soft) p-(--space-4)"
      role="status"
    >
      <div class="flex items-start gap-(--space-3)">
        <div class="flex-1">
          <p class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
            반려동물 프로필은 저장됐어요
          </p><p class="mt-(--space-1) text-(length:--font-xs) leading-relaxed text-(color:--color-slate-dark)">
            동물등록번호 소유자 정보를 확인한 뒤 다시 입력해주세요.
          </p><router-link
            v-if="unverifiedPetId"
            :to="`/pets/${unverifiedPetId}/edit`"
            class="mt-(--space-2) inline-flex text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)"
          >
            프로필 수정하기
          </router-link>
        </div>
        <button
          type="button"
          aria-label="안내 닫기"
          @click="dismissRegistrationNotice"
        >
          <IconClose size="24" />
        </button>
      </div>
    </div>

    <LoadingSpinner
      v-if="isLoading"
      class="py-(--space-10)"
    />
    <EmptyState
      v-else-if="pets.length === 0"
      :icon="IconPetFace"
      :message="'아직 등록된 반려동물이 없어요.\n반려동물을 등록하고 관리를 시작하세요!'"
    />

    <template v-else>
      <nav
        v-if="pets.length > 1"
        class="mb-(--space-4) flex gap-(--space-2) overflow-x-auto pb-(--space-1) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="반려동물 선택"
      >
        <PetSelectorChip
          v-for="pet in orderedPets"
          :key="pet.id"
          :label="pet.name"
          :species="pet.species"
          :selected="pet.id === primaryPet.id"
          :aria-current="pet.id === primaryPet.id ? 'true' : undefined"
          @click="selectPet(pet.id)"
        />
      </nav>

      <article class="relative h-[278px] overflow-hidden rounded-[28px] bg-(--color-leaf-soft) p-(--space-5)">
        <div
          class="relative z-10 min-w-0"
          :class="primaryPet.species === 'CAT' ? 'w-[calc(100%-196px)]' : 'w-[calc(100%-226px)]'"
        >
          <span
            v-if="isRepresentativePet"
            class="inline-flex rounded-full bg-(--color-white) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)"
          >대표 반려동물</span>
          <h2 class="mt-(--space-4) line-clamp-2 break-words text-[28px] leading-[1.15] font-bold text-(color:--color-navy)">
            {{ primaryPet.name }}
          </h2>
          <p class="mt-(--space-1) break-words text-(length:--font-sm) leading-[1.45] text-(color:--color-slate-dark)">
            <span class="block">{{ primaryPet.breed }} · {{ getAge(primaryPet.birthDate) }}살</span>
            <span class="block">중성화 {{ primaryPet.neutered ? '완료' : '미완료' }}</span>
          </p>
          <div class="relative left-[-4px] mt-(--space-4) flex w-max flex-nowrap items-center gap-(--space-2) whitespace-nowrap">
          <router-link
            :to="`/pets/${primaryPet.id}/edit`"
            class="inline-flex rounded-full bg-(--color-white) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-semibold text-(color:--color-navy) no-underline"
          >
            프로필 수정
          </router-link>
          <button
            v-if="!isRepresentativePet"
            type="button"
            class="inline-flex rounded-full bg-(--color-brand-dark) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-semibold text-(color:--color-contrast)"
            @click="setRepresentativePet"
          >
            대표로 설정
          </button>
          </div>
        </div>
        <img
          :src="petHero(primaryPet)"
          :alt="primaryPet.name"
          class="absolute right-(--space-2) bottom-0 object-contain"
          :class="primaryPet.species === 'CAT' ? 'h-[208px] w-[208px]' : 'h-[238px] w-[238px]'"
        >
      </article>

      <section class="mt-(--space-6)">
        <div class="grid grid-cols-2 gap-(--space-3)">
          <router-link
            v-for="menu in lifeMenus"
            :key="menu.label"
            :to="menu.to"
            class="rounded-[20px] bg-(--color-white) p-(--space-4) text-inherit no-underline"
          >
            <FeatureIconTile
              :icon="menu.icon"
              :tone="menu.tone"
            />
            <strong class="mt-(--space-3) block pl-(--space-1) text-(length:--font-sm) text-(color:--color-navy)">{{ menu.label }}</strong>
          </router-link>
        </div>
      </section>

      <!-- petId가 없으면 ShareDiaryView가 pets[0]으로 떨어져 고른 반려동물과 어긋난다. -->
      <router-link
        :to="{ path: '/share/diary', query: { petId: primaryPet.id } }"
        class="mt-(--space-3) flex items-center gap-(--space-4) rounded-[22px] bg-(--color-white) p-(--space-4) text-inherit no-underline"
      >
        <FeatureIconTile
          :icon="IconImage"
          tone="pink"
        />
        <strong class="text-(length:--font-sm) text-(color:--color-navy)">육아일기</strong>
      </router-link>

      <router-link
        to="/pets/register"
        class="mt-(--space-5) flex h-[48px] items-center justify-center rounded-[16px] border border-(--color-card-border) bg-(--color-white) text-(length:--font-sm) font-semibold text-(color:--color-navy) no-underline"
      >
        + 반려동물 추가
      </router-link>
    </template>
  </div>
</template>
