<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { withEulReul } from '@/utils/korean';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import { mockPetsById } from '@/mocks/pet';

const route = useRoute();
const router = useRouter();
const petId = computed(() => route.params.petId);

const pet = computed(() => mockPetsById[petId.value]);
const notFound = computed(() => !pet.value);

const form = ref({
  species: '',
  name: '',
  regNumber: '',
  breed: '',
  birthDate: '',
  neutered: null,
  medicalHistory: '',
});

const existingVaccinationFileName = ref('');
const vaccinationFile = ref(null);
const vaccinationFileName = computed(
  () => vaccinationFile.value?.name ?? existingVaccinationFileName.value,
);
const isSaving = ref(false);
const errorMessage = ref('');
const isDeleteModalOpen = ref(false);

const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/;

function validateForm() {
  if (!form.value.name.trim()) return '이름을 입력해주세요.';
  if (!form.value.breed.trim()) return '견종을 입력해주세요.';
  if (!BIRTH_DATE_PATTERN.test(form.value.birthDate)) {
    return '생년월일을 2023.05.12 형식으로 입력해주세요.';
  }
  if (form.value.regNumber && !REG_NUMBER_PATTERN.test(form.value.regNumber)) {
    return '동물등록번호는 12자리(인식표) 또는 15자리(무선전자인식장치) 숫자로 입력해주세요.';
  }
  return '';
}

watch(
  pet,
  (newPet) => {
    if (!newPet) return;
    form.value = {
      species: newPet.species,
      name: newPet.name,
      regNumber: newPet.regNumber,
      breed: newPet.breed,
      birthDate: newPet.birthDate,
      neutered: newPet.neutered,
      medicalHistory: newPet.medicalHistory,
    };
    existingVaccinationFileName.value = newPet.vaccinationFileName;
    vaccinationFile.value = null;
  },
  { immediate: true },
);

const petName = computed(() => form.value.name || pet.value?.name || '반려동물');

function selectSpecies(species) {
  form.value.species = species;
}

function selectNeutered(neutered) {
  form.value.neutered = neutered;
}

function onFileChange(event) {
  vaccinationFile.value = event.target.files[0] ?? null;
}

function goBack() {
  router.back();
}

async function handleSave() {
  const validationError = validateForm();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }
  errorMessage.value = '';
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

    <div
      v-if="notFound"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>반려동물 정보를 찾을 수 없어요.</p>
    </div>

    <form
      v-else
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
            :aria-pressed="form.species === 'DOG'"
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
                  ? 'var(--color-white)'
                  : 'var(--color-slate-dark)'
              "
            />
            강아지
          </button>
          <button
            type="button"
            :aria-pressed="form.species === 'CAT'"
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
                  ? 'var(--color-white)'
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
          placeholder="12자리 또는 15자리 숫자 입력"
          inputmode="numeric"
          maxlength="15"
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
            :aria-pressed="form.neutered === true"
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
            :aria-pressed="form.neutered === false"
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
        class="flex items-center justify-between h-[46px] px-(--space-4) rounded-(--radius-lg) border border-(--color-slate-muted) bg-(--color-white) text-(length:--font-sm) text-(color:--color-slate-dark) cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-(--color-navy)"
      >
        <span v-if="vaccinationFileName">{{
          vaccinationFileName
        }}</span>
        <span
          v-else
          class="w-full text-center"
        >+ 접종증명서 이미지 업로드</span>
        <span
          v-if="vaccinationFileName"
          class="text-(color:--color-navy) font-medium shrink-0"
        >변경</span>
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        >
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
      :title="`${withEulReul(petName)} 삭제할까요?`"
      description="삭제하면 아래 정보가 함께 삭제되며 복구할 수 없어요"
      :items="[
        '카테고리별 지출·결제 내역',
        '동물등록증 · 접종증명서 등 증명서',
        '자동 분류된 태깅 기록',
      ]"
      @confirm="handleDelete"
    />
  </div>
</template>
