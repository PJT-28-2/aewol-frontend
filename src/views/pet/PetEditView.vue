<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';

const route = useRoute();
const router = useRouter();
const petId = route.params.petId;

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const mockPetsById = {
  1: {
    id: 1,
    name: '소로',
    species: 'DOG',
    regNumber: '410000012345678',
    breed: '포메라니안',
    birthDate: '2023.05.12',
    neutered: true,
    medicalHistory: '슬개골 탈구 이력 있음',
    vaccinationFileName: '접종증명서.jpg',
  },
  2: {
    id: 2,
    name: '나비',
    species: 'CAT',
    regNumber: '',
    breed: '코리안숏헤어',
    birthDate: '2024.03.20',
    neutered: true,
    medicalHistory: '',
    vaccinationFileName: '',
  },
};

const pet = mockPetsById[petId] ?? mockPetsById[1];

const form = ref({
  species: pet.species,
  name: pet.name,
  regNumber: pet.regNumber,
  breed: pet.breed,
  birthDate: pet.birthDate,
  neutered: pet.neutered,
  medicalHistory: pet.medicalHistory,
});

const vaccinationFileName = ref(pet.vaccinationFileName);
const isSaving = ref(false);
const errorMessage = ref('');
const isDeleteModalOpen = ref(false);

const petName = computed(() => form.value.name || pet.name);

function selectSpecies(species) {
  form.value.species = species;
}

function selectNeutered(neutered) {
  form.value.neutered = neutered;
}

function onFileChange(event) {
  const file = event.target.files[0];
  vaccinationFileName.value = file ? file.name : '';
}

function goBack() {
  router.back();
}

async function handleSave() {
  // TODO: implement pet update with pet API
  router.push('/pets');
}

async function handleDelete() {
  // TODO: implement pet deletion with pet API
  isDeleteModalOpen.value = false;
  router.push('/pets');
}
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
        반려동물 프로필 수정
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        {{ petName }}의 정보를 수정해요
      </p>
    </header>

    <form
      class="flex flex-col gap-(--space-5)"
      @submit.prevent="handleSave"
    >
      <div>
        <p
          class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark) mb-(--space-2)"
        >
          종 선택
        </p>
        <div class="flex gap-(--space-2)">
          <button
            type="button"
            class="inline-flex items-center gap-(--space-2) h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
            :class="
              form.species === 'DOG'
                ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
            "
            @click="selectSpecies('DOG')"
          >
            <IconDog
              size="16"
              :color="
                form.species === 'DOG'
                  ? '#ffffff'
                  : 'var(--color-slate-dark)'
              "
            />
            강아지
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-(--space-2) h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
            :class="
              form.species === 'CAT'
                ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
            "
            @click="selectSpecies('CAT')"
          >
            <IconCat
              size="16"
              :color="
                form.species === 'CAT'
                  ? '#ffffff'
                  : 'var(--color-slate-dark)'
              "
            />
            고양이
          </button>
        </div>
      </div>

      <AppInput
        v-model="form.name"
        label="이름"
        placeholder="소로"
      />

      <div>
        <AppInput
          v-model="form.regNumber"
          label="동물등록번호 (선택)"
          placeholder="15자리 숫자 입력"
        />
        <p
          class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          국가동물보호정보시스템(APMS)에 등록된 번호예요. 나중에
          추가하셔도 돼요.
        </p>
      </div>

      <AppInput
        v-model="form.breed"
        label="견종"
        placeholder="포메라니안"
      />

      <AppInput
        v-model="form.birthDate"
        type="text"
        label="생년월일"
        placeholder="2023.05.12"
      />

      <div>
        <p
          class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark) mb-(--space-2)"
        >
          중성화 여부
        </p>
        <div class="flex gap-(--space-2)">
          <button
            type="button"
            class="inline-flex items-center h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
            :class="
              form.neutered === true
                ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
            "
            @click="selectNeutered(true)"
          >
            완료
          </button>
          <button
            type="button"
            class="inline-flex items-center h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
            :class="
              form.neutered === false
                ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
            "
            @click="selectNeutered(false)"
          >
            미완료
          </button>
        </div>
      </div>

      <AppInput
        v-model="form.medicalHistory"
        label="병력 (선택)"
        placeholder="예: 슬개골 탈구 이력 있음"
      />

      <label
        class="flex items-center justify-between h-[46px] px-(--space-4) rounded-(--radius-lg) border border-(--color-slate-muted) bg-(--color-white) text-(length:--font-sm) text-(color:--color-slate-dark) cursor-pointer"
      >
        <span v-if="vaccinationFileName">{{
          vaccinationFileName
        }}</span>
        <span v-else class="w-full text-center"
          >+ 접종증명서 이미지 업로드</span
        >
        <span
          v-if="vaccinationFileName"
          class="text-(color:--color-navy) font-medium shrink-0"
          >변경</span
        >
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />
      </label>

      <p
        v-if="errorMessage"
        class="text-(length:--font-sm) text-(color:--color-danger)"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="isSaving"
      >
        저장하기
      </AppButton>

      <button
        type="button"
        class="flex items-center justify-center h-[52px] rounded-(--radius-xl) border border-(--color-danger-soft) bg-(--color-white) text-(length:--font-base) font-semibold text-(color:--color-danger-strong)"
        @click="isDeleteModalOpen = true"
      >
        이 반려동물 삭제하기
      </button>
    </form>

    <ConfirmDeleteModal
      v-model="isDeleteModalOpen"
      :title="`${petName}를 삭제할까요?`"
      description="삭제하면 아래 정보가 함께 삭제되며 복구할 수 없어요"
      :items="[
        '버킷 잔액 및 지출·결제 내역',
        '동물등록증 · 접종증명서 등 증명서',
        '자동 분류된 태깅 기록',
      ]"
      @confirm="handleDelete"
    />
  </div>
</template>
