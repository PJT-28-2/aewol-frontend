<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconPetFace from '@/components/common/icons/IconPetFace.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import iconCat3d from '@/assets/images/icons-3d/cat_face_3d.png';
import iconDog3d from '@/assets/images/icons-3d/dog_face_3d.png';
import { usePetStore } from '@/stores/pet';

const petStore = usePetStore();
const { pets } = storeToRefs(petStore);
const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const showRegistrationNotice = ref(route.query.registration === 'unverified');
const unverifiedPetId = ref(route.query.petId);

function dismissRegistrationNotice() {
  showRegistrationNotice.value = false;
  router.replace({ path: route.path });
}

function petIcon(species) {
  return species === 'CAT' ? iconCat3d : iconDog3d;
}

function getAge(birthDate) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

onMounted(async () => {
  try {
    await petStore.fetchPets();
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-7))]"
  >
    <header class="mb-(--space-4)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        반려동물 관리
      </h1>
    </header>

    <div
      v-if="showRegistrationNotice"
      class="mb-(--space-4) rounded-(--radius-xl) border border-(--color-gold) bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] p-(--space-4)"
      role="status"
    >
      <div class="flex items-start gap-(--space-3)">
        <div class="min-w-0 flex-1">
          <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
            반려동물 프로필은 저장됐어요
          </p>
          <p class="mt-(--space-1) text-(length:--font-sm) leading-relaxed text-(color:--color-slate-dark)">
            동물등록번호는 확인되지 않았어요. 등록증에 기재된 소유자 정보를 확인한 뒤 프로필 수정에서 다시 입력해 주세요.
          </p>
          <router-link
            v-if="unverifiedPetId"
            :to="`/pets/${unverifiedPetId}/edit`"
            class="mt-(--space-2) inline-flex text-(length:--font-sm) font-semibold text-(color:--color-navy) underline underline-offset-2"
          >
            프로필 수정하기
          </router-link>
        </div>
        <button
          type="button"
          class="shrink-0 text-(color:--color-slate-muted)"
          aria-label="안내 닫기"
          @click="dismissRegistrationNotice"
        >
          <IconClose
            size="18"
            color="currentColor"
          />
        </button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <EmptyState
      v-else-if="pets.length === 0"
      :icon="IconPetFace"
      :message="'아직 등록된 반려동물이 없어요.\n반려동물을 등록하고 관리를 시작하세요!'"
    />

    <ul
      v-else
      class="mb-(--space-4) flex flex-col overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)"
    >
      <li
        v-for="pet in pets"
        :key="pet.id"
      >
        <router-link
          :to="`/pets/${pet.id}/edit`"
          class="flex items-center gap-(--space-3) border-b border-(--color-card-border) p-(--space-4) text-inherit no-underline transition-colors last:border-b-0 active:bg-(--color-gray-100)"
        >
          <span
            class="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-(--color-gray-100)"
          >
            <img
              :src="petIcon(pet.species)"
              :alt="pet.species === 'CAT' ? '고양이' : '강아지'"
              class="size-[34px] object-contain"
            >
          </span>
          <div class="flex-1">
            <h3
              class="text-(length:--font-base) font-semibold text-(color:--color-navy)"
            >
              {{ pet.name }}
            </h3>
            <p
              class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
            >
              {{ pet.breed }} · {{ getAge(pet.birthDate) }}세 ·
              중성화 {{ pet.neutered ? '완료' : '미완료' }}
            </p>
          </div>
          <IconChevronRight
            size="18"
            color="var(--color-gray-400)"
          />
        </router-link>
      </li>
    </ul>

    <router-link
      to="/pets/register"
      class="flex h-[48px] items-center justify-center rounded-(--radius-xl) bg-(--color-leaf) text-(length:--font-base) font-semibold text-(color:--color-gray-900) no-underline"
    >
      + 반려동물 추가
    </router-link>
  </div>
</template>
