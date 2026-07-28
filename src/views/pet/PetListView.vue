<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';

const router = useRouter();

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const pets = ref([
  {
    id: 1,
    name: '소로',
    species: 'DOG',
    breed: '포메라니안',
    birthDate: '2023-05-12',
    neutered: true,
  },
  {
    id: 2,
    name: '나비',
    species: 'CAT',
    breed: '코리안숏헤어',
    birthDate: '2024-03-20',
    neutered: true,
  },
]);

const isLoading = ref(true);

const petNamesText = computed(() =>
  pets.value.length
    ? pets.value.map((pet) => pet.name).join(' · ')
    : '반려동물',
);

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

function petIconBg(species) {
  return species === 'CAT' ? '#EEF3E2' : '#DCE6F5';
}

function getAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function goBack() {
  router.back();
}

onMounted(async () => {
  // TODO: fetch pet list from pet store/API
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen"
  >
    <button
      type="button"
      class="mb-(--space-3) text-(color:--color-navy)"
      aria-label="뒤로 가기"
      @click="goBack"
    >
      <IconArrowLeft size="24" />
    </button>

    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        반려동물 관리
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        {{ petNamesText }} 프로필을 관리해요
      </p>
    </header>

    <div
      v-if="isLoading"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>로딩 중...</p>
    </div>

    <div
      v-else-if="pets.length === 0"
      class="text-center py-(--space-10)"
    >
      <p class="text-(color:--color-gray-700)">
        아직 등록된 반려동물이 없습니다.
      </p>
      <p
        class="text-(length:--font-sm) text-(color:--color-gray-500) mt-(--space-2)"
      >
        반려동물을 등록하고 관리를 시작하세요!
      </p>
    </div>

    <ul
      v-else
      class="flex flex-col gap-(--space-3) mb-(--space-5)"
    >
      <li
        v-for="pet in pets"
        :key="pet.id"
      >
        <router-link
          :to="`/pets/${pet.id}/edit`"
          class="flex items-center gap-(--space-4) bg-(--color-white) border border-(--color-border) rounded-(--radius-xl) p-(--space-4) no-underline"
        >
          <span
            class="flex items-center justify-center shrink-0 w-(--space-9) h-(--space-9) rounded-[14px]"
            :style="{ backgroundColor: petIconBg(pet.species) }"
          >
            <component
              :is="petIcon(pet.species)"
              size="24"
              color="var(--color-navy)"
            />
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
          <span
            class="text-(length:--font-xl) text-(color:--color-gray-400)"
          >&rsaquo;</span>
        </router-link>
      </li>
    </ul>

    <router-link
      to="/pets/register"
      class="flex items-center justify-center h-[52px] rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-base) font-semibold no-underline"
    >
      + 반려동물 추가
    </router-link>
  </div>
</template>
