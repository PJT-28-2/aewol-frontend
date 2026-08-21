<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import { petApi } from '@/api/pet';
import { useMemberStore } from '@/stores/member';
import { formatBirthDateInput, isValidCalendarDate } from '@/utils/date';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconCat from '@/components/common/icons/IconCat.vue';

const router = useRouter();
const memberStore = useMemberStore();

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
const breedLabel = computed(() => (form.value.species === 'CAT' ? '묘종' : '견종'));
const breedPlaceholder = computed(() =>
  form.value.species === 'CAT' ? '예: 코리안 숏헤어' : '예: 포메라니안',
);
const isLoading = ref(false);
const errorMessage = ref('');
const registrationError = ref('');
const registrationSection = ref(null);
const registrationOwnerType = ref('SELF');
const registrationOwnerName = ref('');
const memberName = ref('');

const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/;
const birthDateInput = computed({
  get: () => form.value.birthDate,
  set: (value) => {
    form.value.birthDate = formatBirthDateInput(value);
  },
});

function validateForm() {
  if (!form.value.name.trim()) return '이름을 입력해주세요.';
  if (!form.value.breed.trim()) return '견종을 입력해주세요.';
  if (!BIRTH_DATE_PATTERN.test(form.value.birthDate)) {
    return '생년월일을 2023.05.12 형식으로 입력해주세요.';
  }
  if (!isValidCalendarDate(form.value.birthDate)) {
    return '올바른 생년월일을 입력해주세요.';
  }
  if (form.value.regNumber && !REG_NUMBER_PATTERN.test(form.value.regNumber)) {
    return '동물등록번호는 12자리(인식표) 또는 15자리(무선전자인식장치) 숫자로 입력해주세요.';
  }
  if (form.value.regNumber && !registrationOwnerName.value.trim()) {
    return '동물등록증에 기재된 소유자 이름을 입력해주세요.';
  }
  return '';
}

onMounted(async () => {
  try {
    const profile = memberStore.profile ?? await memberStore.fetchProfile();
    memberName.value = profile?.name ?? '';
    registrationOwnerName.value = memberName.value;
  } catch {
    // 회원 정보 자동 입력에 실패해도 사용자가 직접 소유자 이름을 입력할 수 있다.
  }
});

function selectSpecies(species) {
  form.value.species = species;
}

function selectNeutered(neutered) {
  form.value.neutered = neutered;
}

function selectRegistrationOwner(type) {
  registrationOwnerType.value = type;
  registrationOwnerName.value = type === 'SELF' ? memberName.value : '';
}

function onFileChange(event) {
  const file = event.target.files[0] ?? null;
  if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
    vaccinationFile.value = null;
    event.target.value = '';
    errorMessage.value = 'JPEG 또는 PNG 파일만 업로드할 수 있습니다.';
    return;
  }
  if (file && file.size > 10 * 1024 * 1024) {
    vaccinationFile.value = null;
    event.target.value = '';
    errorMessage.value = '파일 크기는 10MB 이하여야 합니다.';
    return;
  }
  errorMessage.value = '';
  vaccinationFile.value = file;
}

async function moveToRegistrationError() {
  await nextTick();
  registrationSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  registrationSection.value?.querySelector('input')?.focus({ preventScroll: true });
}

async function handleSubmit() {
  errorMessage.value = '';
  registrationError.value = '';
  const validationError = validateForm();
  if (validationError) {
    if (validationError.includes('동물등록')) {
      registrationError.value = validationError;
      await moveToRegistrationError();
    } else errorMessage.value = validationError;
    return;
  }
  isLoading.value = true;
  try {
    const { data } = await petApi.createPet({
      ...form.value,
      registrationOwnerName: form.value.regNumber ? registrationOwnerName.value.trim() : null,
      birthDate: form.value.birthDate.replaceAll('.', '-'),
      neutered: form.value.neutered == null ? null : form.value.neutered ? 'Y' : 'N',
    });
    const createdPet = data.result ?? data;
    const createdPetId = createdPet.petId ?? createdPet.id;
    if (vaccinationFile.value) {
      await petApi.uploadDocument(createdPetId, vaccinationFile.value);
    }
    await router.push({
      path: '/settings/pet-photo',
      query: { mode: 'create', next: '/home', petId: createdPetId },
    });
  } catch (error) {
    const messages = {
      400: '입력 내용과 접종증명서 파일을 확인해주세요.',
      403: '반려동물을 등록할 권한이 없습니다.',
      404: '등록한 반려동물 정보를 찾을 수 없습니다.',
    };
    const message =
      error.response?.data?.message ||
      messages[error.response?.status] ||
      '반려동물 등록에 실패했습니다. 다시 시도해주세요.';
    if (form.value.regNumber && error.response?.status !== 403 && error.response?.status !== 404) {
      registrationError.value = message;
      await moveToRegistrationError();
    } else {
      errorMessage.value = message;
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-7))]"
  >
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        반려동물 프로필 등록
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        함께할 반려동물 정보를 입력해주세요
      </p>
    </header>
    <form
      class="flex flex-col gap-(--space-4)"
      @submit.prevent="handleSubmit"
    >
      <section
        class="flex flex-col gap-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <h2 class="text-(length:--font-base) font-bold text-(color:--color-navy)">
          기본 정보
        </h2>
        <div>
          <p
            class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark) mb-(--space-2)"
          >
            종 선택
          </p>
          <div class="grid grid-cols-2 gap-(--space-3)">
            <button
              type="button"
              :aria-pressed="form.species === 'DOG'"
              class="flex min-h-[76px] items-center gap-(--space-3) rounded-(--radius-xl) border p-(--space-3) text-(length:--font-sm) font-semibold transition-[border-color,background-color,box-shadow]"
              :class="
                form.species === 'DOG'
                  ? 'border-(--color-leaf-dark) bg-(--color-leaf-soft) text-(color:--color-navy) shadow-(--shadow-card)'
                  : 'border-(--color-card-border) bg-(--color-app-bg) text-(color:--color-slate-dark)'
              "
              @click="selectSpecies('DOG')"
            >
              <FeatureIconTile
                :icon="IconDog"
                tone="green"
              />
              강아지
            </button>
            <button
              type="button"
              :aria-pressed="form.species === 'CAT'"
              class="flex min-h-[76px] items-center gap-(--space-3) rounded-(--radius-xl) border p-(--space-3) text-(length:--font-sm) font-semibold transition-[border-color,background-color,box-shadow]"
              :class="
                form.species === 'CAT'
                  ? 'border-(--color-leaf-dark) bg-(--color-leaf-soft) text-(color:--color-navy) shadow-(--shadow-card)'
                  : 'border-(--color-card-border) bg-(--color-app-bg) text-(color:--color-slate-dark)'
              "
              @click="selectSpecies('CAT')"
            >
              <FeatureIconTile
                :icon="IconCat"
                tone="purple"
              />
              고양이
            </button>
          </div>
        </div>

        <AppInput
          v-model="form.name"
          variant="soft"
          label="이름"
          placeholder="소로"
        />

        <div ref="registrationSection">
          <AppInput
            v-model="form.regNumber"
            variant="soft"
            label="동물등록번호 (선택)"
            placeholder="12자리 또는 15자리 숫자 입력"
            inputmode="numeric"
            maxlength="15"
            :error="registrationError"
          />
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            국가동물보호정보시스템(APMS)에 등록된 번호예요. 나중에
            추가해도 괜찮아요.
          </p>
        </div>

        <div v-if="form.regNumber">
          <p class="mb-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)">
            등록증에 기재된 소유자
          </p>
          <div class="mb-(--space-3) grid grid-cols-2 gap-(--space-2) rounded-(--radius-xl) bg-(--color-app-bg) p-[4px]">
            <button
              type="button"
              :aria-pressed="registrationOwnerType === 'SELF'"
              class="inline-flex h-[44px] items-center justify-center rounded-(--radius-lg) text-(length:--font-sm) font-semibold"
              :class="registrationOwnerType === 'SELF' ? 'bg-(--color-white) text-(color:--color-navy) shadow-(--shadow-card)' : 'text-(color:--color-slate-muted)'"
              @click="selectRegistrationOwner('SELF')"
            >
              본인
            </button>
            <button
              type="button"
              :aria-pressed="registrationOwnerType === 'OTHER'"
              class="inline-flex h-[44px] items-center justify-center rounded-(--radius-lg) text-(length:--font-sm) font-semibold"
              :class="registrationOwnerType === 'OTHER' ? 'bg-(--color-white) text-(color:--color-navy) shadow-(--shadow-card)' : 'text-(color:--color-slate-muted)'"
              @click="selectRegistrationOwner('OTHER')"
            >
              다른 사람
            </button>
          </div>
          <AppInput
            v-model="registrationOwnerName"
            variant="soft"
            label="소유자 이름"
            placeholder="등록증에 기재된 이름"
            :readonly="registrationOwnerType === 'SELF'"
          />
          <p class="mt-(--space-1) text-(length:--font-xs) leading-relaxed text-(color:--color-slate-muted)">
            서비스 가입자가 아닌 동물등록증에 기재된 소유자 이름을 입력해 주세요.
          </p>
        </div>

        <AppInput
          v-model="form.breed"
          variant="soft"
          :label="breedLabel"
          :placeholder="breedPlaceholder"
        />

        <AppInput
          v-model="birthDateInput"
          variant="soft"
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
          <div class="grid grid-cols-2 gap-(--space-2) rounded-(--radius-xl) bg-(--color-app-bg) p-[4px]">
            <button
              type="button"
              :aria-pressed="form.neutered === true"
              class="inline-flex h-[44px] items-center justify-center rounded-(--radius-lg) text-(length:--font-sm) font-semibold transition-[background-color,color,box-shadow]"
              :class="
                form.neutered === true
                  ? 'bg-(--color-white) text-(color:--color-navy) shadow-(--shadow-card)'
                  : 'text-(color:--color-slate-muted)'
              "
              @click="selectNeutered(true)"
            >
              완료
            </button>
            <button
              type="button"
              :aria-pressed="form.neutered === false"
              class="inline-flex h-[44px] items-center justify-center rounded-(--radius-lg) text-(length:--font-sm) font-semibold transition-[background-color,color,box-shadow]"
              :class="
                form.neutered === false
                  ? 'bg-(--color-white) text-(color:--color-navy) shadow-(--shadow-card)'
                  : 'text-(color:--color-slate-muted)'
              "
              @click="selectNeutered(false)"
            >
              미완료
            </button>
          </div>
        </div>
      </section>

      <section
        class="flex flex-col gap-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <h2 class="text-(length:--font-base) font-bold text-(color:--color-navy)">
          건강 정보
        </h2>

        <AppInput
          v-model="form.medicalHistory"
          variant="soft"
          label="병력 (선택)"
          placeholder="예: 슬개골 탈구 이력 있음"
        />

        <div>
          <p
            class="mb-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
          >
            접종증명서
          </p>
          <label
            class="flex h-(--control-height-lg) cursor-pointer items-center justify-center rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-4) text-(length:--font-sm) font-medium text-(color:--color-slate-dark) transition-colors has-focus-visible:border-(--color-leaf-dark) has-focus-visible:bg-(--color-white) has-focus-visible:outline-none"
          >
            {{ vaccinationFileName || '+ 접종증명서 이미지 업로드' }}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              class="sr-only"
              @change="onFileChange"
            >
          </label>
        </div>
      </section>

      <p
        v-if="errorMessage"
        class="text-(length:--font-sm) text-(color:--color-danger-strong)"
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
