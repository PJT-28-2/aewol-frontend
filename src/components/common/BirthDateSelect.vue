<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  minYear: {
    type: Number,
    default: () => new Date().getFullYear() - 50,
  },
});

const emit = defineEmits(['update:modelValue']);

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();

const selectedYear = ref('');
const selectedMonth = ref('');
const selectedDay = ref('');
let syncingFromModel = false;

const years = computed(() =>
  Array.from(
    { length: currentYear - props.minYear + 1 },
    (_, index) => currentYear - index,
  ),
);

const months = computed(() => {
  const lastMonth = Number(selectedYear.value) === currentYear ? currentMonth : 12;
  return Array.from({ length: lastMonth }, (_, index) => index + 1);
});

const days = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return [];

  const year = Number(selectedYear.value);
  const month = Number(selectedMonth.value);
  const lastDay = year === currentYear && month === currentMonth
    ? currentDay
    : new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => index + 1);
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function syncFromModel(value) {
  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value ?? '');
  syncingFromModel = true;
  selectedYear.value = match?.[1] ?? '';
  selectedMonth.value = match ? String(Number(match[2])) : '';
  selectedDay.value = match ? String(Number(match[3])) : '';
  syncingFromModel = false;
}

watch(
  () => props.modelValue,
  (value) => syncFromModel(value),
  { immediate: true },
);

watch([selectedYear, selectedMonth], () => {
  if (selectedMonth.value && !months.value.includes(Number(selectedMonth.value))) {
    selectedMonth.value = String(months.value.at(-1));
  }
  if (selectedDay.value && !days.value.includes(Number(selectedDay.value))) {
    selectedDay.value = days.value.length ? String(days.value.at(-1)) : '';
  }
});

watch([selectedYear, selectedMonth, selectedDay], () => {
  if (syncingFromModel) return;

  const nextValue = selectedYear.value && selectedMonth.value && selectedDay.value
    ? `${selectedYear.value}.${pad(selectedMonth.value)}.${pad(selectedDay.value)}`
    : '';

  if (nextValue !== props.modelValue) emit('update:modelValue', nextValue);
});
</script>

<template>
  <fieldset>
    <legend class="mb-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)">
      생년월일
    </legend>
    <div class="grid grid-cols-3 gap-(--space-2)">
      <label class="min-w-0">
        <span class="sr-only">출생 연도</span>
        <select
          v-model="selectedYear"
          aria-label="출생 연도"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
        >
          <option value="">년</option>
          <option
            v-for="year in years"
            :key="year"
            :value="year"
          >
            {{ year }}년
          </option>
        </select>
      </label>

      <label class="min-w-0">
        <span class="sr-only">출생 월</span>
        <select
          v-model="selectedMonth"
          aria-label="출생 월"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
        >
          <option value="">월</option>
          <option
            v-for="month in months"
            :key="month"
            :value="month"
          >
            {{ month }}월
          </option>
        </select>
      </label>

      <label class="min-w-0">
        <span class="sr-only">출생 일</span>
        <select
          v-model="selectedDay"
          aria-label="출생 일"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
        >
          <option value="">일</option>
          <option
            v-for="day in days"
            :key="day"
            :value="day"
          >
            {{ day }}일
          </option>
        </select>
      </label>
    </div>
  </fieldset>
</template>
