<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';

const router = useRouter();

const form = ref({
  species: 'DOG',
  name: '',
  regNumber: '',
  breed: '',
  birthDate: '',
  neutered: null,
  medicalHistory: '',
});

const vaccinationFile = ref(null);
const vaccinationFileName = computed(() => vaccinationFile.value?.name ?? '');
const isLoading = ref(false);
const errorMessage = ref('');

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

async function handleSubmit() {
  // TODO: implement pet registration with pet API
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
        반려동물 프로필 등록
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        우리 아이 정보를 입력해주세요
      </p>
    </header>

    <form
      class="flex flex-col gap-(--space-5)"
      @submit.prevent="handleSubmit"
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
          placeholder="15자리 숫자 입력"
        />
        <p
          class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          국가동물보호정보시스템(APMS)에 등록된 번호예요. 나중에
          추가해도 괜찮아요.
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
        class="flex items-center justify-center h-[46px] rounded-(--radius-lg) border border-(--color-slate-muted) bg-(--color-white) text-(length:--font-sm) text-(color:--color-slate-dark) cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-(--color-navy)"
      >
        {{
          vaccinationFileName
            ? vaccinationFileName
            : '+ 접종증명서 이미지 업로드'
        }}
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
        :loading="isLoading"
      >
        등록 완료
      </AppButton>
    </form>
  </div>
</template>
