<script setup>
import { ref, computed } from 'vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const medicalOptions = [
  { code: 'DENTAL', label: '치과·구강질환' },
  { code: 'URINARY', label: '비뇨기질환' },
  { code: 'FOREIGN_BODY', label: '이물섭취/이물제거' },
  { code: 'JOINT', label: '슬개골·관절질환' },
  { code: 'SKIN', label: '피부질환' },
  { code: 'DIGESTIVE', label: '소화기질환' },
  { code: 'NONE', label: '병력 없음' },
  { code: 'OTHER', label: '기타' },
];

const pendingCode = ref(null);
const pendingOtherText = ref('');
const tagFeedback = ref('');
let nextTagId = 0;

const isMedicalSheetOpen = ref(false);
const pendingLabel = computed(
  () =>
    medicalOptions.find((opt) => opt.code === pendingCode.value)
      ?.label ?? '병력을 선택해주세요',
);

function selectPendingCode(code) {
  pendingCode.value = code;
  isMedicalSheetOpen.value = false;
}

function addMedicalTag() {
  tagFeedback.value = '';

  if (!pendingCode.value) {
    tagFeedback.value = '병력을 선택해주세요.';
    return;
  }

  const isOther = pendingCode.value === 'OTHER';
  const label = isOther
    ? pendingOtherText.value.trim()
    : medicalOptions.find(
        (opt) => opt.code === pendingCode.value,
      )?.label;

  if (isOther && !label) {
    tagFeedback.value = '병력 내용을 입력해주세요.';
    return;
  }

  const isDuplicate = props.modelValue.some((tag) =>
    isOther
      ? tag.code === 'OTHER' && tag.label === label
      : tag.code === pendingCode.value,
  );
  if (isDuplicate) {
    tagFeedback.value = '이미 추가된 병력이에요.';
    return;
  }

  const remainingTags =
    pendingCode.value === 'NONE'
      ? []
      : props.modelValue.filter((tag) => tag.code !== 'NONE');

  emit('update:modelValue', [
    ...remainingTags,
    { id: nextTagId++, code: pendingCode.value, label },
  ]);
  pendingOtherText.value = '';
}

function removeMedicalTag(id) {
  emit(
    'update:modelValue',
    props.modelValue.filter((tag) => tag.id !== id),
  );
}
</script>

<template>
  <div>
    <label
      id="medical-label"
      class="block text-(length:--font-sm) font-medium text-(color:--color-gray-700) mb-(--space-2)"
    >
      병력
    </label>

    <div
      v-if="modelValue.length"
      class="flex flex-wrap gap-(--space-2) mb-(--space-3)"
    >
      <span
        v-for="tag in modelValue"
        :key="tag.id"
        class="inline-flex items-center gap-(--space-2) py-(--space-1) px-(--space-3) bg-(--color-gray-100) rounded-(--radius-full) text-(length:--font-sm) text-(color:--color-gray-800)"
      >
        {{ tag.label }}
        <button
          type="button"
          class="text-(color:--color-gray-500) text-(length:--font-md) leading-none"
          :aria-label="`${tag.label} 삭제`"
          @click="removeMedicalTag(tag.id)"
        >
          ×
        </button>
      </span>
    </div>

    <div class="flex gap-(--space-2)">
      <button
        type="button"
        class="flex-1 min-w-0 flex items-center justify-between gap-(--space-2) h-(--control-height-md) px-(--space-4) border border-(--color-gray-300) rounded-(--radius-lg) text-(length:--font-base) bg-(--color-white)"
        :class="pendingCode ? 'text-(color:--color-gray-800)' : 'text-(color:--color-slate-muted)'"
        aria-haspopup="dialog"
        :aria-expanded="isMedicalSheetOpen"
        aria-labelledby="medical-label"
        @click="isMedicalSheetOpen = true"
      >
        <span>{{ pendingLabel }}</span>
        <IconChevronDown
          size="16"
          color="var(--color-gray-500)"
        />
      </button>
      <input
        v-if="pendingCode === 'OTHER'"
        v-model="pendingOtherText"
        type="text"
        placeholder="병력을 입력해주세요"
        aria-label="기타 병력 직접 입력"
        class="flex-1 min-w-0 h-(--control-height-md) px-(--space-4) border border-(--color-gray-300) rounded-(--radius-lg) text-(length:--font-base)"
      />
      <AppButton
        type="button"
        variant="navy"
        size="md"
        class="flex-none !h-(--control-height-md)"
        @click="addMedicalTag"
      >
        추가
      </AppButton>
    </div>

    <p
      v-if="tagFeedback"
      class="mt-(--space-2) text-(color:--color-danger-strong) text-(length:--font-sm)"
    >
      {{ tagFeedback }}
    </p>

    <BottomSheet v-model="isMedicalSheetOpen" title="병력 선택">
      <ul>
        <li v-for="opt in medicalOptions" :key="opt.code">
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              opt.code === pendingCode
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectPendingCode(opt.code)"
          >
            <span>{{ opt.label }}</span>
            <IconCheck
              v-if="opt.code === pendingCode"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
