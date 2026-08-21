<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { withEulReul } from '@/utils/korean';
import AppButton from '@/components/common/AppButton.vue';
import AppInput from '@/components/common/AppInput.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import { petApi } from '@/api/pet';
import { usePetStore } from '@/stores/pet';
import { useMemberStore } from '@/stores/member';
import { formatBirthDateInput, isValidCalendarDate } from '@/utils/date';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconCat from '@/components/common/icons/IconCat.vue';

const route = useRoute();
const router = useRouter();
const petStore = usePetStore();
const memberStore = useMemberStore();
const petId = computed(() => route.params.petId);

const pet = ref(null);
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
const existingVaccinationDocument = ref(null);
const vaccinationFile = ref(null);
const vaccinationFileName = computed(
  () => vaccinationFile.value?.name ?? existingVaccinationFileName.value,
);
const isSaving = ref(false);
const isDeleting = ref(false);
const errorMessage = ref('');
const registrationError = ref('');
const registrationSection = ref(null);
const isDeleteModalOpen = ref(false);
const isDocumentDeleteModalOpen = ref(false);
const isDocumentMarkedForDeletion = ref(false);
const registrationOwnerType = ref('SELF');
const registrationOwnerName = ref('');
const memberName = ref('');
const isChangingRegistration = ref(false);
const isRegistrationDisconnectModalOpen = ref(false);
const isDisconnectingRegistration = ref(false);

const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/;
const birthDateInput = computed({
  get: () => form.value.birthDate,
  set: (value) => {
    form.value.birthDate = formatBirthDateInput(value);
  },
});

function getDocumentFileName(document) {
  if (!document) return '';

  const responseFileName =
    document.docName || document.originalFileName || document.fileName;
  if (responseFileName) return responseFileName;

  const storedFileName = document.fileUrl?.split('/').pop();
  return storedFileName ? decodeURIComponent(storedFileName) : '';
}

onBeforeRouteLeave(() => {
  vaccinationFile.value = null;
  isDocumentMarkedForDeletion.value = false;
  existingVaccinationFileName.value = getDocumentFileName(
    existingVaccinationDocument.value,
  );
  isDocumentDeleteModalOpen.value = false;
});

onMounted(async () => {
  isSaving.value = true;
  try {
    try {
      const profile = memberStore.profile ?? await memberStore.fetchProfile();
      memberName.value = profile?.name ?? '';
      registrationOwnerName.value = memberName.value;
    } catch {
      // 회원 정보 자동 입력에 실패해도 사용자가 직접 소유자 이름을 입력할 수 있다.
    }
    const { data } = await petApi.getPet(petId.value);
    pet.value = data.result ?? data;
    try {
      const { data: documentData } = await petApi.getDocuments(petId.value);
      const documents = documentData.result ?? [];
      existingVaccinationDocument.value =
        documents.find((document) => document.docType === 'VACCINATION') ?? null;
      existingVaccinationFileName.value = getDocumentFileName(
        existingVaccinationDocument.value,
      );
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message || '접종증명서를 불러오지 못했습니다.';
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || '반려동물 정보를 불러오지 못했습니다.';
  } finally {
    isSaving.value = false;
  }
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
  if (shouldVerifyRegistration.value && !registrationOwnerName.value.trim()) {
    return '동물등록증에 기재된 소유자 이름을 입력해주세요.';
  }
  if (pet.value?.regNumber && !form.value.regNumber) {
    return '검증된 동물등록번호는 비워둘 수 없습니다.';
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
      birthDate: newPet.birthDate?.replaceAll('-', '.') ?? '',
      neutered: newPet.neutered === true || newPet.neutered === 'Y',
      medicalHistory: newPet.medicalHistory,
    };
    vaccinationFile.value = null;
  },
  { immediate: true },
);

const petName = computed(() => form.value.name || pet.value?.name || '반려동물');
const breedLabel = computed(() => (form.value.species === 'CAT' ? '묘종' : '견종'));
const breedPlaceholder = computed(() =>
  form.value.species === 'CAT' ? '예: 코리안 숏헤어' : '예: 포메라니안',
);
const shouldVerifyRegistration = computed(() =>
  Boolean(form.value.regNumber) && (
    form.value.regNumber !== (pet.value?.regNumber ?? '') ||
    form.value.name !== (pet.value?.name ?? '') ||
    form.value.birthDate !== (pet.value?.birthDate?.replaceAll('-', '.') ?? '') ||
    registrationOwnerType.value === 'OTHER'
  ),
);
const hasVerifiedRegistration = computed(() => Boolean(pet.value?.regNumber));

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

function startRegistrationChange() {
  isChangingRegistration.value = true;
  form.value.regNumber = '';
  registrationError.value = '';
}

function cancelRegistrationChange() {
  isChangingRegistration.value = false;
  form.value.regNumber = pet.value?.regNumber ?? '';
  registrationOwnerType.value = 'SELF';
  registrationOwnerName.value = memberName.value;
  registrationError.value = '';
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

async function handleSave() {
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
  isSaving.value = true;
  try {
    await petApi.updatePet(petId.value, {
      ...form.value,
      registrationOwnerName: shouldVerifyRegistration.value
        ? registrationOwnerName.value.trim()
        : null,
      birthDate: form.value.birthDate.replaceAll('.', '-'),
      neutered: form.value.neutered == null ? null : form.value.neutered ? 'Y' : 'N',
    });
    if (
      isDocumentMarkedForDeletion.value &&
      existingVaccinationDocument.value
    ) {
      await petApi.deleteDocument(
        petId.value,
        existingVaccinationDocument.value.docId,
      );
    }
    if (vaccinationFile.value) {
      await petApi.uploadDocument(petId.value, vaccinationFile.value);
    }
    await router.push('/pets');
  } catch (error) {
    const messages = {
      400: '입력 내용과 접종증명서 파일을 확인해주세요.',
      403: '반려동물을 수정할 권한이 없습니다.',
      404: '반려동물 정보를 찾을 수 없습니다.',
    };
    const message =
      error.response?.data?.message ||
      messages[error.response?.status] ||
      '반려동물 수정에 실패했습니다. 다시 시도해주세요.';
    if (form.value.regNumber && error.response?.status !== 403 && error.response?.status !== 404) {
      registrationError.value = message;
      await moveToRegistrationError();
    } else {
      errorMessage.value = message;
    }
  } finally {
    isSaving.value = false;
  }
}

async function handleRegistrationDisconnect() {
  if (isDisconnectingRegistration.value) return;
  registrationError.value = '';
  isDisconnectingRegistration.value = true;
  try {
    await petApi.disconnectRegistration(petId.value);
    pet.value = { ...pet.value, regNumber: '' };
    form.value.regNumber = '';
    isChangingRegistration.value = false;
    isRegistrationDisconnectModalOpen.value = false;
  } catch (error) {
    registrationError.value =
      error.response?.data?.message || '동물등록증 연동 해제에 실패했습니다.';
    isRegistrationDisconnectModalOpen.value = false;
  } finally {
    isDisconnectingRegistration.value = false;
  }
}

async function handleDelete() {
  if (isDeleting.value) return;
  errorMessage.value = '';
  isDeleting.value = true;
  try {
    await petStore.deletePet(petId.value);
    isDeleteModalOpen.value = false;
    await router.push('/pets');
  } catch (error) {
    const messages = {
      403: '반려동물 등록을 해제할 권한이 없습니다.',
      404: '반려동물 정보를 찾을 수 없습니다.',
    };
    errorMessage.value =
      error.response?.data?.message ||
      messages[error.response?.status] ||
      '반려동물 등록 해제에 실패했습니다. 다시 시도해주세요.';
  } finally {
    isDeleting.value = false;
  }
}

function handleDocumentDelete() {
  if (!existingVaccinationDocument.value) return;
  errorMessage.value = '';
  isDocumentMarkedForDeletion.value = true;
  existingVaccinationFileName.value = '';
  vaccinationFile.value = null;
  isDocumentDeleteModalOpen.value = false;
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-7))]"
  >
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        반려동물 프로필 수정
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        등록된 반려동물 정보를 관리해요
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
      class="flex flex-col gap-(--space-4)"
      @submit.prevent="handleSave"
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
            :readonly="hasVerifiedRegistration && !isChangingRegistration"
            :error="registrationError"
          />
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            국가동물보호정보시스템(APMS)에 등록된 번호예요. 나중에
            추가하셔도 돼요.
          </p>
          <div v-if="hasVerifiedRegistration" class="mt-(--space-2) flex gap-(--space-2)">
            <button
              v-if="!isChangingRegistration"
              type="button"
              class="text-(length:--font-sm) font-semibold text-(--color-navy)"
              @click="startRegistrationChange"
            >
              등록번호 변경
            </button>
            <button
              v-else
              type="button"
              class="text-(length:--font-sm) font-semibold text-(--color-slate-muted)"
              @click="cancelRegistrationChange"
            >
              변경 취소
            </button>
            <button
              type="button"
              class="text-(length:--font-sm) font-semibold text-(--color-danger-strong)"
              @click="isRegistrationDisconnectModalOpen = true"
            >
              연동 해제
            </button>
          </div>
        </div>

        <div v-if="form.regNumber && (!hasVerifiedRegistration || isChangingRegistration || shouldVerifyRegistration)">
          <div class="mb-(--space-2) flex items-center justify-between gap-(--space-2)">
            <p class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark)">
              등록증에 기재된 소유자
            </p>
            <span
              class="rounded-(--radius-full) px-(--space-2) py-[2px] text-(length:--font-xs) font-semibold"
              :class="!shouldVerifyRegistration ? 'bg-(--color-leaf-soft) text-(color:--color-leaf-dark)' : 'bg-(--color-gray-100) text-(color:--color-slate-muted)'"
            >
              {{ !shouldVerifyRegistration ? '검증 완료' : '미검증' }}
            </span>
          </div>
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
            label="검증용 소유자 이름"
            placeholder="등록증에 기재된 이름"
            :readonly="registrationOwnerType === 'SELF'"
          />
          <p class="mt-(--space-1) text-(length:--font-xs) leading-relaxed text-(color:--color-slate-muted)">
            서비스 가입자가 아닌 동물등록증에 기재된 이름을 입력해 주세요. 이 값은 등록번호 검증에만 사용됩니다.
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
          <div
            class="flex h-(--control-height-lg) items-center overflow-hidden rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) text-(length:--font-sm) text-(color:--color-slate-dark)"
          >
            <label
              class="flex h-full min-w-0 flex-1 items-center justify-between px-(--space-4) has-focus-visible:outline-2 has-focus-visible:outline-(--color-navy)"
              :class="existingVaccinationDocument && !isDocumentMarkedForDeletion && !vaccinationFile ? 'cursor-default' : 'cursor-pointer'"
            >
              <span v-if="vaccinationFileName">{{ vaccinationFileName }}</span>
              <span
                v-else
                class="w-full text-center"
              >+ 접종증명서 이미지 업로드</span>
              <span
                v-if="vaccinationFile"
                class="shrink-0 font-medium text-(color:--color-navy)"
              >변경</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                class="sr-only"
                :disabled="Boolean(existingVaccinationDocument && !isDocumentMarkedForDeletion && !vaccinationFile)"
                @change="onFileChange"
              >
            </label>

            <button
              v-if="existingVaccinationDocument && !isDocumentMarkedForDeletion && !vaccinationFile"
              type="button"
              class="flex h-full w-[46px] shrink-0 items-center justify-center border-l border-(--color-border) bg-(--color-white) text-(color:--color-danger-strong)"
              aria-label="접종증명서 삭제"
              @click="isDocumentDeleteModalOpen = true"
            >
              <IconClose
                size="18"
                color="currentColor"
              />
            </button>
          </div>
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
        :loading="isSaving"
      >
        저장하기
      </AppButton>

      <AppButton
        type="button"
        variant="danger"
        size="lg"
        block
        @click="isDeleteModalOpen = true"
      >
        반려동물 등록 해제
      </AppButton>
    </form>

    <ConfirmDeleteModal
      v-model="isDeleteModalOpen"
      :title="`${withEulReul(petName)} 애월에서 떠나보낼까요?`"
      description="등록을 해제하면 반려동물과 연결된 정보가 모두 제거되며 복구할 수 없어요."
      :items="[
        '반려동물 기본 정보와 건강 기록',
        '동물등록증과 접종증명서 등 등록 문서',
        '연결된 지출 내역과 분류 기록',
      ]"
      confirm-label="등록 해제"
      :confirm-loading="isDeleting"
      @confirm="handleDelete"
    />

    <ConfirmDeleteModal
      v-model="isDocumentDeleteModalOpen"
      title="접종증명서를 삭제할까요?"
      description="저장하면 접종증명서가 삭제돼요. 삭제 후에는 복구할 수 없어요."
      confirm-label="삭제"
      @confirm="handleDocumentDelete"
    />

    <ConfirmDeleteModal
      v-model="isRegistrationDisconnectModalOpen"
      title="동물등록증 연동을 해제할까요?"
      description="등록번호와 동물등록증 정보가 프로필에서 제거됩니다. 반려동물 프로필은 유지돼요."
      confirm-label="연동 해제"
      :confirm-loading="isDisconnectingRegistration"
      @confirm="handleRegistrationDisconnect"
    />
  </div>
</template>
