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

function parseModelValue(value) {
  if (!value) return { year: '', month: '', day: '' };

  const match = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const lastDay = new Date(year, month, 0).getDate();
  const isFuture = year > currentYear
    || (year === currentYear && month > currentMonth)
    || (year === currentYear && month === currentMonth && day > currentDay);

  if (year < props.minYear || year > currentYear
      || month < 1 || month > 12
      || day < 1 || day > lastDay
      || isFuture) {
    return null;
  }

  return {
    year: String(year),
    month: String(month),
    day: String(day),
  };
}

function syncFromModel(value) {
  const parsed = parseModelValue(value);
  selectedYear.value = parsed?.year ?? '';
  selectedMonth.value = parsed?.month ?? '';
  selectedDay.value = parsed?.day ?? '';
}

watch(
  () => props.modelValue,
  (value) => syncFromModel(value),
  { immediate: true },
);

function clampSelection() {
  if (selectedMonth.value && !months.value.includes(Number(selectedMonth.value))) {
    selectedMonth.value = String(months.value.at(-1));
  }
  if (selectedDay.value && !days.value.includes(Number(selectedDay.value))) {
    selectedDay.value = days.value.length ? String(days.value.at(-1)) : '';
  }
}

function emitSelection(clearIncomplete = false) {
  const isComplete = selectedYear.value && selectedMonth.value && selectedDay.value;
  if (!isComplete && !clearIncomplete) return;

  const nextValue = isComplete
    ? `${selectedYear.value}.${pad(selectedMonth.value)}.${pad(selectedDay.value)}`
    : '';
  if (nextValue !== props.modelValue) emit('update:modelValue', nextValue);
}

function handleYearChange(event) {
  selectedYear.value = event.target.value;
  if (!selectedYear.value) {
    selectedMonth.value = '';
    selectedDay.value = '';
    emitSelection(true);
    return;
  }
  clampSelection();
  emitSelection();
}

function handleMonthChange(event) {
  selectedMonth.value = event.target.value;
  if (!selectedMonth.value) {
    selectedDay.value = '';
    emitSelection(true);
    return;
  }
  clampSelection();
  emitSelection();
}

function handleDayChange(event) {
  selectedDay.value = event.target.value;
  emitSelection(!selectedDay.value);
}
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
          :value="selectedYear"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
          @change="handleYearChange"
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
          :value="selectedMonth"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
          @change="handleMonthChange"
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
          :value="selectedDay"
          class="h-[48px] w-full rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) text-(color:--color-navy) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
          @change="handleDayChange"
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
